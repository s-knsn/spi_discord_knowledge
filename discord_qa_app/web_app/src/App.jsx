import React, { useState, useMemo, useEffect } from 'react';
import qaDataRaw from './data/qa_pairs.json';
import './index.css';

// 1. カテゴリの集計と「その他」への統合
const categoryCounts = qaDataRaw.reduce((acc, qa) => {
  const cat = qa.category || '未分類';
  acc[cat] = (acc[cat] || 0) + 1;
  return acc;
}, {});

const sortedRawCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

const MIN_COUNT = 3; // 3件未満は「その他」に統合
const categoryMap = {};
const finalCategoryCounts = { 'その他': 0 };

sortedRawCategories.forEach(([cat, count]) => {
  if (cat === '未分類' || count < MIN_COUNT) {
    categoryMap[cat] = 'その他';
    finalCategoryCounts['その他'] += count;
  } else {
    categoryMap[cat] = cat;
    finalCategoryCounts[cat] = count;
  }
});

const displayCategories = Object.entries(finalCategoryCounts)
  .filter(([cat, count]) => count > 0)
  .sort((a, b) => {
    if (a[0] === 'その他') return 1; // その他は最後に
    if (b[0] === 'その他') return -1;
    return b[1] - a[1];
  });

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


function App() {
  const [qaData] = useState(qaDataRaw);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

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
                        <p>{qa.clean_qa.question}</p>
                      </div>
                      <div className="clean-item answer">
                        <div className="clean-icon a-icon">A</div>
                        <p>{qa.clean_qa.answer}</p>
                      </div>
                    </div>
                  )}
                  
                  {qa.raw_thread && qa.raw_thread.length > 0 && (
                    <details className="raw-thread-details">
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
                                  <p>{message.text}</p>
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
    </div>
  );
}

export default App;
