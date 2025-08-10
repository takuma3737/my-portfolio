-- name: GetUserByIdentifierHash :one
WITH ins AS (
  INSERT INTO users (identifier_hash) VALUES ($1)
  ON CONFLICT (identifier_hash) DO NOTHING
  RETURNING id
)

SELECT id FROM ins
UNION ALL
SELECT u.id FROM users u
WHERE u.identifier_hash = $1
  AND NOT EXISTS (SELECT 1 FROM ins)
LIMIT 1;

/*
-- name: GetArticleLikesWithUserStatus :one
SELECT
  COUNT(*) AS count,
  EXISTS (
    SELECT 1
    FROM article_likes
    WHERE article_id = $1 AND user_id = $2
  ) AS user_liked
FROM article_likes
WHERE article_id = $1;
*/