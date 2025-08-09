CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS article_likes (
    id SERIAL PRIMARY KEY,
    article_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id, user_id)
);

CREATE TABLE IF NOT EXISTS article_comments (
    id SERIAL PRIMARY KEY,
    article_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_articles_author_id ON articles(author_id);
CREATE INDEX idx_articles_published_at ON articles(published_at);
CREATE INDEX idx_articles_created_at ON articles(created_at);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

CREATE INDEX idx_article_likes_article_id ON article_likes(article_id);
CREATE INDEX idx_article_likes_user_id ON article_likes(user_id);

CREATE INDEX idx_article_comments_article_id ON article_comments(article_id);
CREATE INDEX idx_article_comments_user_id ON article_comments(user_id);
CREATE INDEX idx_article_comments_created_at ON article_comments(created_at);

ALTER TABLE article_views ADD FOREIGN KEY (article_id) REFERENCES articles(id);
ALTER TABLE article_views ADD FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE article_likes ADD FOREIGN KEY (article_id) REFERENCES articles(id);
ALTER TABLE article_likes ADD FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE article_comments ADD FOREIGN KEY (article_id) REFERENCES articles(id);
ALTER TABLE article_comments ADD FOREIGN KEY (user_id) REFERENCES users(id);
