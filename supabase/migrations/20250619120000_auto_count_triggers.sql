-- ============================================================================
-- Auto-count triggers for comments and likes
-- ============================================================================

-- 1. Comments count trigger
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS post_comments_count_trigger ON comments;
CREATE TRIGGER post_comments_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- 2. Likes count trigger
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS post_likes_count_trigger ON likes;
CREATE TRIGGER post_likes_count_trigger
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- 3. Recalculate existing counts
UPDATE posts SET comments_count = (
  SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id
);

UPDATE posts SET likes_count = (
  SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id
);
