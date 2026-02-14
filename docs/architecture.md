# CanPark アーキテクチャ概要

## 1. システム全体構成

```mermaid
graph TB
    subgraph External["外部サービス"]
        microCMS["microCMS<br/>(ヘッドレスCMS)"]
        Firebase["Firebase<br/>(Realtime Database)"]
        GA4["Google Analytics 4"]
        GitHub["GitHub"]
    end

    subgraph Build["ビルド環境"]
        Actions["GitHub Actions<br/>(CI/CD)"]
        Astro["Astro SSG<br/>(静的サイト生成)"]
    end

    subgraph Hosting["ホスティング"]
        Pages["GitHub Pages<br/>(canpark.blog)"]
    end

    subgraph Dev["ローカル開発"]
        Docker["Docker<br/>(astro-blog-dev)"]
    end

    subgraph Client["クライアント (ブラウザ)"]
        Browser["ブラウザ"]
    end

    microCMS -- "記事データ (API)" --> Astro
    Astro -- "静的HTML/CSS/JS" --> Pages
    GitHub -- "push / PR" --> Actions
    Actions -- "ビルド & デプロイ" --> Pages
    microCMS -- "Webhook" --> Actions
    Browser -- "閲覧" --> Pages
    Browser -- "ページビュー記録" --> Firebase
    Browser -- "アクセス解析" --> GA4
    Firebase -- "統計データ取得" --> Browser
    Docker -- "開発サーバー<br/>localhost:3000" --> Browser
```

## 2. ディレクトリ構成

```mermaid
graph LR
    Root["myblog/"]

    Root --> GH[".github/workflows/"]
    Root --> App["app/"]
    Root --> DockerF["Dockerfile"]
    Root --> Compose["docker-compose.yml"]
    Root --> Claude["CLAUDE.md"]
    Root --> Docs["docs/"]

    GH --> Deploy["deploy.yml"]
    GH --> CI["ci.yml"]
    GH --> AutoRel["auto-release.yml"]

    App --> Src["src/"]
    App --> Public["public/"]
    App --> Dist["dist/"]
    App --> AstroConf["astro.config.mjs"]
    App --> Pkg["package.json"]

    Src --> Components["components/"]
    Src --> Layouts["layouts/"]
    Src --> Pages["pages/"]
    Src --> Lib["lib/"]
    Src --> Utils["utils/"]
    Src --> Constants["constants/"]
    Src --> Styles["styles/"]
```

## 3. コンポーネント構成

```mermaid
graph TB
    subgraph Layout["Layout.astro (共通レイアウト)"]
        Nav["ナビゲーションバー<br/>(ロゴ + リンク)"]
        Header["ヘッダー"]
        Slot["コンテンツ (slot)"]
        Footer["フッター"]
        GAComp["GoogleAnalytics.astro"]
    end

    Header --> PlayerStatus["PlayerStatus.astro<br/>(訪問者ステータス)"]

    subgraph Pages["ページ"]
        Index["index.astro<br/>(トップページ)"]
        PostDetail["posts/[id].astro<br/>(記事詳細)"]
        About["about.astro"]
        Portfolio["portfolio/index.astro"]
        Tech["tech/index.astro"]
    end

    Index --> CategoryTabs["CategoryTabs.astro<br/>(カテゴリフィルタ)"]
    Index --> BlogCard["BlogCard.astro<br/>(記事カード)"]

    PostDetail --> ArticleHeader["ArticleHeader.astro<br/>(記事ヘッダー)"]
    PostDetail --> ArticleContent["ArticleContent.astro<br/>(記事本文)"]
    PostDetail --> RelatedPosts["RelatedPosts.astro<br/>(関連記事)"]
    RelatedPosts --> BlogCard
```

## 4. データフロー

```mermaid
sequenceDiagram
    participant CMS as microCMS
    participant Build as Astro (ビルド時)
    participant Pages as GitHub Pages
    participant Browser as ブラウザ
    participant FB as Firebase

    Note over CMS, Build: ビルド時データ取得
    Build->>CMS: getArticles() / getArticle(id)
    CMS-->>Build: 記事データ (JSON)
    Build->>Build: 静的HTML生成 (SSG)
    Build->>Pages: デプロイ (dist/)

    Note over Browser, FB: ランタイム (クライアント側)
    Browser->>Pages: ページ閲覧
    Pages-->>Browser: 静的HTML/CSS/JS
    Browser->>FB: incrementPageView()
    Browser->>FB: getVisitorStats()
    FB-->>Browser: totalPageViews, dailyViews
    Browser->>Browser: レベル計算 & UI更新
```

## 5. 訪問者ステータス (ゲーミフィケーション)

```mermaid
graph LR
    PV["ページビュー数<br/>(totalPageViews)"] --> Calc["levelCalculator.ts"]
    Calc --> Level["現在レベル"]
    Calc --> EXP["経験値バー (%)"]

    subgraph 計算ロジック
        Calc
        Formula["次レベル必要EXP<br/>= (level + 1) × 10"]
    end

    subgraph 表示
        Level --> UI["PlayerStatus.astro"]
        EXP --> UI
        Daily["本日のPV"] --> UI
        Total["累計PV (km表記)"] --> UI
    end
```

## 6. CI/CD パイプライン

```mermaid
graph LR
    subgraph Triggers["トリガー"]
        Push["push to main/release"]
        PR["PR to release"]
        Webhook["microCMS Webhook"]
        Manual["手動実行"]
    end

    subgraph CI["ci.yml"]
        Test["pnpm test:run<br/>(Vitest)"]
    end

    subgraph Deploy["deploy.yml"]
        Checkout["コードチェックアウト"]
        Setup["pnpm + Node 20 セットアップ"]
        Env[".env 生成<br/>(GitHub Secrets)"]
        Install["pnpm install"]
        Build["pnpm run build"]
        Upload["GitHub Pages デプロイ"]
    end

    PR --> Test
    Push --> Checkout
    Webhook --> Checkout
    Manual --> Checkout
    Checkout --> Setup --> Env --> Install --> Build --> Upload
```

## 7. Docker 開発環境

```mermaid
graph TB
    subgraph Host["ホストマシン"]
        AppDir["./app/<br/>(ソースコード)"]
        EnvFile[".env"]
    end

    subgraph Container["Docker: astro-blog-dev"]
        WorkDir["/app"]
        DevServer["Astro Dev Server<br/>:4321"]
        NodeModules["node_modules<br/>(コンテナ内)"]
    end

    AppDir -- "ボリュームマウント" --> WorkDir
    EnvFile -- "env_file" --> Container
    DevServer -- "ポートマッピング<br/>3000:4321" --> Browser["ブラウザ<br/>localhost:3000"]
```

## 8. 技術スタック

| カテゴリ | 技術 | 用途 |
|---------|------|------|
| フレームワーク | Astro 4.13 | 静的サイト生成 (SSG) |
| 言語 | TypeScript | 型安全な開発 |
| CMS | microCMS | 記事コンテンツ管理 |
| データベース | Firebase Realtime DB | 訪問者統計の永続化 |
| アナリティクス | Google Analytics 4 | アクセス解析 |
| テスト | Vitest + Testing Library | ユニットテスト |
| コンテナ | Docker + Docker Compose | ローカル開発環境 |
| CI/CD | GitHub Actions | テスト・ビルド・デプロイ |
| ホスティング | GitHub Pages | 静的サイト配信 |
| パッケージ管理 | pnpm | 依存関係管理 |
| ドメイン | canpark.blog | カスタムドメイン |

## 9. 環境変数

```mermaid
graph LR
    subgraph Server["サーバーサイド (ビルド時のみ)"]
        MCMS_DOMAIN["MICROCMS_SERVICE_DOMAIN"]
        MCMS_KEY["MICROCMS_API_KEY"]
    end

    subgraph Client["クライアントサイド (PUBLIC_ プレフィックス)"]
        FB_API["PUBLIC_FIREBASE_API_KEY"]
        FB_AUTH["PUBLIC_FIREBASE_AUTH_DOMAIN"]
        FB_DB["PUBLIC_FIREBASE_DATABASE_URL"]
        FB_PROJ["PUBLIC_FIREBASE_PROJECT_ID"]
        FB_STORE["PUBLIC_FIREBASE_STORAGE_BUCKET"]
        FB_MSG["PUBLIC_FIREBASE_MESSAGING_SENDER_ID"]
        FB_APP["PUBLIC_FIREBASE_APP_ID"]
        GA_ID["PUBLIC_GA_MEASUREMENT_ID"]
    end

    Server --> Astro["Astro SSG<br/>(ビルド時)"]
    Client --> Browser["ブラウザ<br/>(ランタイム)"]
```
