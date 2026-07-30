-- AIWAY 데이터베이스 스키마
-- 계획서 4-4-1에서 확정한 "안 B" — 사용 내역과 저장된 프롬프트를 분리하는 구조입니다.
--
-- 적용 방법:
--   1) Render 대시보드 → New → PostgreSQL (무료 플랜) 생성
--   2) 생성된 Internal Database URL을 서버의 환경변수 DATABASE_URL에 넣기
--   3) psql로 접속해 이 파일을 실행:  psql "<DATABASE_URL>" -f db/schema.sql

-- ────────────────────────────────────────────
-- 1) 사용자
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(50)  NOT NULL,
  -- 비밀번호는 절대 평문으로 저장하지 않습니다. 해시값만 보관합니다.
  pin_hash    VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP    DEFAULT NOW(),
  -- 이름은 로그인 식별자로 쓰이므로 중복될 수 없습니다.
  CONSTRAINT users_name_unique UNIQUE (name)
);

-- ────────────────────────────────────────────
-- 2) Prompt Coach 사용 내역 (전체 로그, 자동으로 쌓임)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prompt_coach_history (
  id              SERIAL PRIMARY KEY,
  -- 회원이 탈퇴하면 그 사람의 기록도 함께 삭제됩니다.
  user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
  category        VARCHAR(50),
  raw_input       TEXT NOT NULL,
  improved_prompt TEXT NOT NULL,
  -- AI가 "왜 이렇게 고쳤는지" 설명한 문장. 마이페이지 사용 내역에서 함께 보여줍니다.
  reason          TEXT,
  score           INTEGER,
  -- {clarity, context, output_condition, detail, role} — 각 0~20
  score_breakdown JSONB,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- 이미 테이블을 만들어 둔 뒤에 reason 컬럼을 추가하는 경우 (기존 DB 마이그레이션):
--   ALTER TABLE prompt_coach_history ADD COLUMN IF NOT EXISTS reason TEXT;

-- 마이페이지에서 "내 기록을 최신순으로" 조회하는 것이 가장 잦은 질의라,
-- 그 조합에 맞춰 인덱스를 만들어 둡니다.
CREATE INDEX IF NOT EXISTS idx_history_user_recent
  ON prompt_coach_history (user_id, created_at DESC);

-- ────────────────────────────────────────────
-- 3) 저장된 프롬프트 (사용자가 ⭐를 눌러 명시적으로 저장한 것만)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_prompts (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  -- NULL 허용: 코스별 예시 프롬프트처럼 AI 분석을 거치지 않고 바로 저장한 경우
  history_id  INTEGER REFERENCES prompt_coach_history(id) ON DELETE SET NULL,
  title       VARCHAR(100),
  prompt_text TEXT NOT NULL,
  category    VARCHAR(50),
  saved_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_user_recent
  ON saved_prompts (user_id, saved_at DESC);
