-- Study-Fizz Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_accepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Schools: readable by all (for demo browsing)
CREATE POLICY "Schools are viewable by everyone"
  ON schools FOR SELECT
  TO authenticated, anon
  USING (true);

-- Profiles: public read (limited fields handled in queries), own update
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Courses: readable by all
CREATE POLICY "Courses are viewable by everyone"
  ON courses FOR SELECT
  TO authenticated, anon
  USING (true);

-- Course memberships: users manage their own
CREATE POLICY "Users can view their own memberships"
  ON course_memberships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can join courses"
  ON course_memberships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave courses"
  ON course_memberships FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Posts: public read, authenticated insert, author update/delete
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their posts"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Answers: public read, authenticated insert, author update/delete
CREATE POLICY "Answers are viewable by everyone"
  ON answers FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can create answers"
  ON answers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their answers"
  ON answers FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their answers"
  ON answers FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Post accepts: post authors can manage
CREATE POLICY "Post accepts are viewable by everyone"
  ON post_accepts FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Post authors can accept answers"
  ON post_accepts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts
      WHERE id = post_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "Post authors can update accepts"
  ON post_accepts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE id = post_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "Post authors can delete accepts"
  ON post_accepts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE id = post_id AND author_id = auth.uid()
    )
  );

-- Listings: public read, authenticated insert, seller update/delete
CREATE POLICY "Listings are viewable by everyone"
  ON listings FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can create listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their listings"
  ON listings FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

-- Listing images: follow listing permissions
CREATE POLICY "Listing images are viewable by everyone"
  ON listing_images FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Sellers can add images"
  ON listing_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings
      WHERE id = listing_id AND seller_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can delete images"
  ON listing_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE id = listing_id AND seller_id = auth.uid()
    )
  );

-- Threads: members only
CREATE POLICY "Thread members can view threads"
  ON threads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM thread_members
      WHERE thread_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create threads"
  ON threads FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Thread members: members can view, creator can add
CREATE POLICY "Thread members can view membership"
  ON thread_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM thread_members tm
      WHERE tm.thread_id = thread_members.thread_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join threads"
  ON thread_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Messages: members only
CREATE POLICY "Thread members can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM thread_members
      WHERE thread_id = messages.thread_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Thread members can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM thread_members
      WHERE thread_id = messages.thread_id AND user_id = auth.uid()
    )
  );

-- Reports: authenticated insert, reporter can view own
CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Blocks: blocker manages own
CREATE POLICY "Users can view their blocks"
  ON blocks FOR SELECT
  TO authenticated
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create blocks"
  ON blocks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can remove blocks"
  ON blocks FOR DELETE
  TO authenticated
  USING (auth.uid() = blocker_id);

-- AI Quizzes: owner only
CREATE POLICY "Users can view their own quizzes"
  ON ai_quizzes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create quizzes"
  ON ai_quizzes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their quizzes"
  ON ai_quizzes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- AI Usage: owner only
CREATE POLICY "Users can view their own usage"
  ON ai_usage_daily FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their usage"
  ON ai_usage_daily FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their usage"
  ON ai_usage_daily FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Subscriptions: owner can view (updates via service role only)
CREATE POLICY "Users can view their subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Note: Subscription updates happen via service role in webhooks
