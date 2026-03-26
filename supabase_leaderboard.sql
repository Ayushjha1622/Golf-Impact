create or replace view leaderboard_view as
select 
user_id,
avg(score) as avg_score,
count(*) as total_scores
from scores
group by user_id
having count(*) >= 5
order by avg_score desc;
