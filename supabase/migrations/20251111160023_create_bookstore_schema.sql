/*
  # Bookstore Schema - Complete Database Setup

  ## Overview
  Creates a complete schema for a personal bookstore website with authentication,
  books catalog, shopping cart, and review system.

  ## Tables Created
  
  ### 1. profiles
  Extends auth.users with additional user information
  - id (uuid, FK to auth.users)
  - full_name (text)
  - avatar_url (text)
  - created_at (timestamptz)
  - updated_at (timestamptz)

  ### 2. books
  Main catalog of books for sale
  - id (uuid, PK)
  - title (text, indexed)
  - author (text, indexed)
  - publisher (text)
  - year_published (integer)
  - isbn (text, unique)
  - price (decimal)
  - cover_url (text)
  - description (text)
  - excerpt (text)
  - category (text, indexed)
  - rating_avg (decimal)
  - rating_count (integer)
  - stock (integer)
  - created_at (timestamptz)
  - updated_at (timestamptz)

  ### 3. cart_items
  Shopping cart for authenticated users
  - id (uuid, PK)
  - user_id (uuid, FK to auth.users)
  - book_id (uuid, FK to books)
  - quantity (integer)
  - created_at (timestamptz)
  - updated_at (timestamptz)

  ### 4. reviews
  Book reviews and ratings from users
  - id (uuid, PK)
  - book_id (uuid, FK to books)
  - user_id (uuid, FK to auth.users)
  - rating (integer, 1-5)
  - comment (text)
  - created_at (timestamptz)
  - updated_at (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Policies enforce authenticated access where needed
  - Public read access for books catalog
  - Users can only manage their own cart and reviews
  - Profile updates restricted to owner only

  ## Indexes
  - Books indexed by title, author, category for fast searches
  - Composite unique index on cart_items (user_id, book_id)
  - Composite unique index on reviews (book_id, user_id) to prevent duplicate reviews

  ## Notes
  - All timestamps use timestamptz for proper timezone handling
  - Rating average is denormalized for performance
  - Stock tracking included for inventory management
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  publisher text,
  year_published integer,
  isbn text UNIQUE,
  price decimal(10,2) NOT NULL DEFAULT 0,
  cover_url text,
  description text,
  excerpt text,
  category text NOT NULL DEFAULT 'Uncategorized',
  rating_avg decimal(3,2) DEFAULT 0,
  rating_count integer DEFAULT 0,
  stock integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view books"
  ON books FOR SELECT
  TO public
  USING (true);

-- Create indexes for fast book searches
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cart"
  ON cart_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items"
  ON cart_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart items"
  ON cart_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items"
  ON cart_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create unique index to prevent duplicate cart entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_user_book ON cart_items(user_id, book_id);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create unique index to prevent duplicate reviews
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_book_user ON reviews(book_id, user_id);

-- Function to update book rating when reviews change
CREATE OR REPLACE FUNCTION update_book_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE books
  SET 
    rating_avg = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)),
    rating_count = (SELECT COUNT(*) FROM reviews WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)),
    updated_at = now()
  WHERE id = COALESCE(NEW.book_id, OLD.book_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update book ratings
DROP TRIGGER IF EXISTS trigger_update_book_rating ON reviews;
CREATE TRIGGER trigger_update_book_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_book_rating();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at to all tables
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_books_updated_at ON books;
CREATE TRIGGER trigger_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_cart_items_updated_at ON cart_items;
CREATE TRIGGER trigger_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_reviews_updated_at ON reviews;
CREATE TRIGGER trigger_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert sample books data
INSERT INTO books (title, author, publisher, year_published, isbn, price, cover_url, description, excerpt, category, stock) VALUES
  ('Đắc Nhân Tâm', 'Dale Carnegie', 'NXB Tổng Hợp', 2018, '978-1234567001', 95000, 'https://images.pexels.com/photos/1130980/pexels-photo-1130980.jpeg', 'Cuốn sách kinh điển về kỹ năng giao tiếp và ứng xử để thành công trong cuộc sống và công việc.', 'Những nguyên tắc cơ bản trong việc ứng xử với con người...', 'Kỹ năng sống', 50),
  ('Nhà Giả Kim', 'Paulo Coelho', 'NXB Văn học', 2020, '978-1234567002', 78000, 'https://images.pexels.com/photos/1301585/pexels-photo-1301585.jpeg', 'Hành trình theo đuổi ước mơ của chàng chăn cừu Santiago qua sa mạc Sahara.', 'Khi muốn điều gì đó, cả vũ trụ sẽ giúp bạn đạt được điều đó...', 'Tiểu thuyết', 35),
  ('Tuổi Trẻ Đáng Giá Bao Nhiêu', 'Rosie Nguyễn', 'NXB Hội Nhà Văn', 2019, '978-1234567003', 82000, 'https://images.pexels.com/photos/1329711/pexels-photo-1329711.jpeg', 'Những trải nghiệm và suy ngẫm về tuổi trẻ, ước mơ và sự nỗ lực.', 'Bạn hãy cứ sống như một người hạnh phúc...', 'Kỹ năng sống', 42),
  ('Nghĩ Giàu & Làm Giàu', 'Napoleon Hill', 'NXB Tổng Hợp', 2017, '978-1234567004', 125000, 'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg', 'Triết lý thành công và làm giàu được đúc kết từ hàng trăm triệu phú.', 'Mọi thành tựu, mọi sự giàu có đều bắt nguồn từ ý tưởng...', 'Kinh tế', 28),
  ('Sapiens: Lược Sử Loài Người', 'Yuval Noah Harari', 'NXB Thế Giới', 2021, '978-1234567005', 189000, 'https://images.pexels.com/photos/1290141/pexels-photo-1290141.jpeg', 'Câu chuyện về sự tiến hóa của loài người từ thời kỳ đồ đá đến hiện đại.', 'Cách đây 100,000 năm, ít nhất có sáu loài người sống trên Trái Đất...', 'Lịch sử', 45),
  ('Atomic Habits', 'James Clear', 'NXB Thế Giới', 2020, '978-1234567006', 142000, 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg', 'Hướng dẫn xây dựng thói quen tốt và loại bỏ thói quen xấu.', 'Những thay đổi nhỏ bé hàng ngày có thể mang lại kết quả phi thường...', 'Kỹ năng sống', 38),
  ('Harry Potter và Hòn Đá Phù Thủy', 'J.K. Rowling', 'NXB Trẻ', 2019, '978-1234567007', 165000, 'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg', 'Cuộc phiêu lưu kỳ diệu của cậu bé phù thủy Harry Potter tại Hogwarts.', 'Cậu bé mồ côi sống dưới gầm cầu thang không ngờ mình là phù thủy...', 'Thiếu nhi', 52),
  ('Tôi Thấy Hoa Vàng Trên Cỏ Xanh', 'Nguyễn Nhật Ánh', 'NXB Trẻ', 2018, '978-1234567008', 92000, 'https://images.pexels.com/photos/1329711/pexels-photo-1329711.jpeg', 'Câu chuyện tuổi thơ đẹp đẽ về tình anh em và làng quê Việt Nam.', 'Tôi nhớ về những ngày thơ ấu với cỏ cây và hoa vàng...', 'Văn học Việt', 61),
  ('The 7 Habits of Highly Effective People', 'Stephen Covey', 'NXB Tổng Hợp', 2016, '978-1234567009', 178000, 'https://images.pexels.com/photos/1301585/pexels-photo-1301585.jpeg', '7 thói quen để trở thành người thành công và hiệu quả.', 'Hãy chủ động, bắt đầu với mục tiêu cuối cùng trong tâm trí...', 'Kỹ năng sống', 33),
  ('Homo Deus: Lược Sử Tương Lai', 'Yuval Noah Harari', 'NXB Thế Giới', 2022, '978-1234567010', 195000, 'https://images.pexels.com/photos/1290141/pexels-photo-1290141.jpeg', 'Tương lai của loài người khi chinh phục được đói, chiến tranh và bệnh tật.', 'Trong thế kỷ 21, con người sẽ hướng tới sự bất tử và hạnh phúc vĩnh cửu...', 'Lịch sử', 29),
  ('Mắt Biếc', 'Nguyễn Nhật Ánh', 'NXB Trẻ', 2017, '978-1234567011', 88000, 'https://images.pexels.com/photos/1329711/pexels-photo-1329711.jpeg', 'Câu chuyện tình đầu trong sáng của Ngạn và Hà Lan.', 'Tôi vẫn luôn nhớ đôi mắt biếc trong veo của cô bé...', 'Văn học Việt', 47),
  ('Rich Dad Poor Dad', 'Robert Kiyosaki', 'NXB Lao Động', 2019, '978-1234567012', 135000, 'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg', 'Bài học về tiền bạc và đầu tư từ hai người cha.', 'Người giàu không làm việc vì tiền, họ để tiền làm việc cho họ...', 'Kinh tế', 41),
  ('Cà Phê Cùng Tony', 'Tony Buổi Sáng', 'NXB Trẻ', 2018, '978-1234567013', 72000, 'https://images.pexels.com/photos/1130980/pexels-photo-1130980.jpeg', 'Những suy ngẫm về cuộc sống, sự nghiệp và hạnh phúc.', 'Cuộc đời là những tách cà phê, đắng ngọt đan xen...', 'Kỹ năng sống', 55),
  ('Đọc Vị Bất Kỳ Ai', 'David Lieberman', 'NXB Thế Giới', 2020, '978-1234567014', 98000, 'https://images.pexels.com/photos/1301585/pexels-photo-1301585.jpeg', 'Kỹ thuật đọc ngôn ngữ cơ thể và tâm lý học trong giao tiếp.', 'Mắt là cửa sổ của tâm hồn, hãy học cách nhìn và lắng nghe...', 'Tâm lý học', 36),
  ('Muôn Kiếp Nhân Sinh', 'Nguyên Phong', 'NXB Tổng Hợp', 2020, '978-1234567015', 156000, 'https://images.pexels.com/photos/1290141/pexels-photo-1290141.jpeg', 'Những câu chuyện về luân hồi và nghiệp quả qua nhiều kiếp sống.', 'Trong vô số kiếp luân hồi, linh hồn học được bài học gì?', 'Tâm linh', 44)
ON CONFLICT (isbn) DO NOTHING;