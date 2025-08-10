-- name: GetUserByIdentifierHash :one
select id
from users
where identifier_hash = $1
limit 1;

-- name: UpsertUserByIdentifierHash :one
with ins as (
  insert into users (identifier_hash)
  values ($1)
  on conflict (identifier_hash) do nothing
  returning id
)
select id from ins
union all
select u.id
from users u
where u.identifier_hash = $1
  and not exists (select 1 from ins)
limit 1;

