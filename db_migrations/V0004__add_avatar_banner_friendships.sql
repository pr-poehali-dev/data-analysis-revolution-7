ALTER TABLE t_p62279667_data_analysis_revolu.users
  ADD COLUMN IF NOT EXISTS avatar_url text NULL,
  ADD COLUMN IF NOT EXISTS banner_url text NULL;

CREATE TABLE IF NOT EXISTS t_p62279667_data_analysis_revolu.friendships (
  id serial PRIMARY KEY,
  requester_id bigint NOT NULL,
  addressee_id bigint NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending',
  created_at timestamp DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);