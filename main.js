/**
 * リンク集ページ - メインスクリプト
 * 最小限の機能のみ実装
 */

document.addEventListener('DOMContentLoaded', function() {
  // リンク追跡（オプション）
  // 将来的にアナリティクス連携時に使用
  const linkCards = document.querySelectorAll('.link-card');
  
  linkCards.forEach(card => {
    card.addEventListener('click', function(e) {
      const label = this.querySelector('.link-card__label')?.textContent || 'Unknown';
      // コンソールにログを出力（開発時用）
      console.log('Link clicked:', label);
    });
  });
});
