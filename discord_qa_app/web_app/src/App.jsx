import React, { useState, useMemo, useEffect } from 'react';
import qaDataRaw from './data/qa_pairs.json';
import './index.css';

// 1. 大カテゴリへのマッピング定義
const categoryMappingRules = {
  '📱 ツール・アカウント準備': ['ツール設定', 'アカウント運用', 'アカウント設定', 'アカウント戦略', 'アカウント設計', 'アカウント管理', '運用'],
  '📢 集客・SNS運用': ['集客', 'SNS運用', '運用・集客', 'ブランディング', '運用ノウハウ', '運用フロー', 'コミュニティ', 'コミュニティ運営'],
  '🔮 鑑定・顧客対応': ['鑑定手法', '顧客対応', 'トラブル対応', 'トラブルシューティング', '顧客管理', '鑑定倫理', 'コミュニケーション'],
  '💰 販売・セールス': ['販売戦略', '販売', 'セールス', '販売・セールス', '営業', '営業戦略', '商品販売', '商品設計', '商品提供', '商品開発', '販売・決済', 'アップセル', '料金設定', '決済', '支払い'],
  '🚀 戦略・マインド・経営': ['マネタイズ', 'ビジネスモデル', 'ビジネス', 'ビジネス運営', 'ビジネス戦略', '事業拡大', '事業戦略', '収益化', 'マインド', 'マインド・戦略', '業務効率化', 'オペレーション', '外注', '外注化', '外注・効率化', '効率化', 'AI活用', '運用戦略', '運用効率', '運用ルール', '法律・税務', '税務', '税務・法務', '戦略'],
  '📦 その他': ['未分類', 'その他', 'デザイン', 'コンテンツ制作', 'ツール・リソース', '分析', 'コンテンツ作成', 'プラットフォーム活用']
};

const categoryMap = {};
Object.entries(categoryMappingRules).forEach(([mainCategory, subCategories]) => {
  subCategories.forEach(sub => {
    categoryMap[sub] = mainCategory;
  });
});

const finalCategoryCounts = {
  '📱 ツール・アカウント準備': 0,
  '📢 集客・SNS運用': 0,
  '🔮 鑑定・顧客対応': 0,
  '💰 販売・セールス': 0,
  '🚀 戦略・マインド・経営': 0,
  '📦 その他': 0
};

qaDataRaw.forEach(qa => {
  const cat = qa.category || '未分類';
  const mainCat = categoryMap[cat] || '📦 その他';
  finalCategoryCounts[mainCat] = (finalCategoryCounts[mainCat] || 0) + 1;
});

// プロセス順に固定して表示するための配列
const displayCategories = [
  '📱 ツール・アカウント準備',
  '📢 集客・SNS運用',
  '🔮 鑑定・顧客対応',
  '💰 販売・セールス',
  '🚀 戦略・マインド・経営',
  '📦 その他'
].map(cat => [cat, finalCategoryCounts[cat]]).filter(([cat, count]) => count > 0);

// 2. 人気タグの集計
const tagCounts = qaDataRaw.reduce((acc, qa) => {
  (qa.tags || []).forEach(tag => {
    acc[tag] = (acc[tag] || 0) + 1;
  });
  return acc;
}, {});
const popularTags = Object.entries(tagCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 8) // 上位8件を表示
  .map(t => t[0]);

// 3. テキスト自動整形＆ハイライト用ヘルパー関数
const formatAndHighlightText = (text, highlightKeyword) => {
  if (!text) return null;
  
  // 自動整形（句点での改行、箇条書きの改行）
  let formattedText = text
    .replace(/([①-⑳1-9１-９][.．、])/g, '\n$1') // 数字の箇条書き
    .replace(/([^ \n])([・])/g, '$1\n$2') // 「・」の箇条書き
    .replace(/。(?![」\]）\n])/g, '。\n\n'); // 句点の後に改行（閉じ括弧の前などは除外）

  // 連続する改行を2つに制限
  formattedText = formattedText.replace(/\n{3,}/g, '\n\n').trim();

  // ハイライトキーワードがない場合
  if (!highlightKeyword || highlightKeyword.trim() === '') {
    return <span style={{ whiteSpace: 'pre-wrap' }}>{formattedText}</span>;
  }

  // キーワードがある場合、大文字小文字を区別せずに分割してハイライト
  const escapedKeyword = highlightKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedKeyword})`, 'gi');
  const parts = formattedText.split(regex);

  return (
    <span style={{ whiteSpace: 'pre-wrap' }}>
      {parts.map((part, i) => 
        regex.test(part) ? <span key={i} className="highlight">{part}</span> : part
      )}
    </span>
  );
};



function App() {
  const [qaData] = useState(qaDataRaw);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [anyLogOpen, setAnyLogOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // トップへ戻るボタンの表示制御
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 個別ログの開閉時に状態をチェック
  const handleLogToggle = () => {
    // onToggle発火直後はDOMが更新されているので判定可能
    const openDetails = document.querySelectorAll('.raw-thread-details[open]');
    setAnyLogOpen(openDetails.length > 0);
  };

  // ログの一括開閉制御
  const toggleAllLogs = () => {
    const shouldOpenAll = !anyLogOpen; // 1つでも開いていたら「すべて閉じる」、0なら「すべて開く」
    const details = document.querySelectorAll('.raw-thread-details');
    details.forEach(d => {
      if (shouldOpenAll) {
        d.setAttribute('open', '');
      } else {
        d.removeAttribute('open');
      }
    });
    setAnyLogOpen(shouldOpenAll);
  };

  // お気に入り状態の管理 (localStorage)
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('discord_qa_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('discord_qa_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (originalIndex) => {
    setFavorites(prev => {
      if (prev.includes(originalIndex)) {
        return prev.filter(id => id !== originalIndex);
      } else {
        return [...prev, originalIndex];
      }
    });
  };

  const filteredData = useMemo(() => {
    // データをマッピングし、元のインデックスを付与
    let result = qaData.map((qa, index) => ({
      ...qa,
      originalIndex: index,
      displayCategory: categoryMap[qa.category || '未分類'] || 'その他'
    }));

    // お気に入りフィルター
    if (showFavoritesOnly) {
      result = result.filter(qa => favorites.includes(qa.originalIndex));
    }

    // 検索フィルター
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(qa => {
        const cleanText = qa.clean_qa ? (qa.clean_qa.question + ' ' + qa.clean_qa.answer) : '';
        const rawText = (qa.raw_thread || []).map(t => t.text).join(' ');
        return (
          qa.title.toLowerCase().includes(lowerSearch) || 
          cleanText.toLowerCase().includes(lowerSearch) ||
          rawText.toLowerCase().includes(lowerSearch)
        );
      });
    }

    // カテゴリフィルター
    if (selectedCategory) {
      result = result.filter(qa => qa.displayCategory === selectedCategory);
    }

    // タグフィルター
    if (selectedTag) {
      result = result.filter(qa => (qa.tags || []).includes(selectedTag));
    }

    // 並び替え (元の順序＝古い順。降順＝新しい順)
    result.sort((a, b) => {
      if (sortOrder === 'newest') {
        return b.originalIndex - a.originalIndex;
      } else {
        return a.originalIndex - b.originalIndex;
      }
    });

    return result;
  }, [qaData, searchTerm, selectedCategory, selectedTag, sortOrder, favorites, showFavoritesOnly]);

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-bg"></div>
        <div className="header-content">
          <h1>スピリチュアルビジネス ナレッジベース</h1>
          <p>過去の貴重な質問と回答を素早く検索・閲覧</p>
        </div>
      </header>
      
      <main className="main-content">
        <section className="controls">
          <div className="search-bar-container">
            <input 
              type="text" 
              className="search-input" 
              placeholder="キーワードで検索... (例: Instagram, 鑑定)" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="search-icon">🔍</div>
          </div>
          
          {/* 人気タグ（クイックフィルター） */}
          <div className="popular-tags-container">
            <span className="tags-label">人気タグ:</span>
            <div className="tags-list">
              <button 
                className={`tag-filter-btn ${selectedTag === '' ? 'active' : ''}`}
                onClick={() => setSelectedTag('')}
              >
                すべて
              </button>
              {popularTags.map(tag => (
                <button 
                  key={tag} 
                  className={`tag-filter-btn ${selectedTag === tag ? 'active' : ''}`}
                  onClick={() => setSelectedTag(tag)}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-options-row">
            <select 
              className="control-select category-select" 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">すべてのカテゴリ ({qaData.length}件)</option>
              {displayCategories.map(([cat, count]) => (
                <option key={cat} value={cat}>{cat} ({count}件)</option>
              ))}
            </select>

            <select 
              className="control-select sort-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">新しい順</option>
              <option value="oldest">古い順</option>
            </select>

            <button 
              className={`fav-filter-btn ${showFavoritesOnly ? 'active' : ''}`}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              {showFavoritesOnly ? '★ お気に入りのみ表示中' : '☆ お気に入り絞り込み'}
            </button>

            <button 
              className="fav-filter-btn toggle-logs-btn"
              onClick={toggleAllLogs}
              title={anyLogOpen ? 'すべてのログを閉じる' : 'すべてのログを開く'}
            >
              {anyLogOpen ? '▲ ログをすべて閉じる' : '▼ ログをすべて開く'}
            </button>
          </div>
        </section>

        <section className="results-info">
          <span>{filteredData.length} 件のナレッジが見つかりました</span>
        </section>

        <section className="cards-grid">
          {filteredData.length > 0 ? (
            filteredData.map((qa, idx) => {
              const isFav = favorites.includes(qa.originalIndex);
              return (
                <div key={qa.originalIndex} className="qa-card active">
                  <div className="qa-card-header">
                    <span className="category-badge">{qa.displayCategory}</span>
                    <div className="tags">
                      {(qa.tags || []).map(tag => (
                        <span key={tag} className="tag-badge" onClick={() => setSelectedTag(tag)}>#{tag}</span>
                      ))}
                    </div>
                    <button 
                      className={`favorite-btn ${isFav ? 'active' : ''}`}
                      onClick={() => toggleFavorite(qa.originalIndex)}
                      title={isFav ? "お気に入りから外す" : "お気に入りに追加"}
                    >
                      {isFav ? '★' : '☆'}
                    </button>
                  </div>
                  
                  <div className="qa-card-title">
                     <h3>{qa.title}</h3>
                  </div>
                  
                  {qa.clean_qa && (
                    <div className="qa-clean-block">
                      <div className="clean-item question">
                        <div className="clean-icon q-icon">Q</div>
                        <p>{formatAndHighlightText(qa.clean_qa.question, searchTerm)}</p>
                      </div>
                      <div className="clean-item answer">
                        <div className="clean-icon a-icon">A</div>
                        <p>{formatAndHighlightText(qa.clean_qa.answer, searchTerm)}</p>
                      </div>
                    </div>
                  )}
                  
                  {qa.raw_thread && qa.raw_thread.length > 0 && (
                    <details className="raw-thread-details" onToggle={handleLogToggle}>
                      <summary>▶ 実際のやり取りのログを見る (Raw Chat)</summary>
                      <div className="qa-body">
                        {qa.raw_thread.map((message, mIdx) => {
                          return (
                            <React.Fragment key={mIdx}>
                              {mIdx > 0 && <div className="qa-divider"></div>}
                              <div className="qa-block">
                                <div className="user-icon">
                                  <span className="icon-text">{message.speaker.charAt(0)}</span>
                                </div>
                                <div className="qa-text">
                                  <span className="speaker-name">
                                    {message.speaker}
                                  </span>
                                  <p>{formatAndHighlightText(message.text, searchTerm)}</p>
                                </div>
                              </div>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </details>
                  )}
                  
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <p>キーワードや条件に一致するナレッジが見つかりませんでした。</p>
            </div>
          )}
        </section>
      </main>

      {/* トップへ戻るフローティングボタン */}
      <button 
        className={`scroll-to-top-btn ${showScrollTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        title="一番上に戻る"
      >
        ↑
      </button>
    </div>
  );
}

export default App;
