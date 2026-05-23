-- 계정과목 시드 데이터 (실제 Supabase에 적용 완료 — 2026-05-22)
-- 재무 담당자 + 시무장로 검토 후 코드/이름 수정 가능

-- 수입 (type = 'income')
INSERT INTO accounting.accounts (code, name, type, sort_order) VALUES
  ('4100', '헌금',       'income', 10),
  ('4101', '주일헌금',   'income', 11),
  ('4102', '십일조',     'income', 12),
  ('4103', '감사헌금',   'income', 13),
  ('4104', '선교헌금',   'income', 14),
  ('4105', '건축헌금',   'income', 15),
  ('4106', '특별헌금',   'income', 16),
  ('4107', '작정헌금',   'income', 17),
  ('4200', '기타수입',   'income', 20)
ON CONFLICT (code) DO NOTHING;

-- 지출 (type = 'expense')
INSERT INTO accounting.accounts (code, name, type, sort_order) VALUES
  ('5100', '인건비',         'expense', 30),
  ('5101', '목회자사례비',   'expense', 31),
  ('5102', '직원급여',       'expense', 32),
  ('5103', '4대보험',        'expense', 33),
  ('5200', '관리운영비',     'expense', 40),
  ('5201', '공과금',         'expense', 41),
  ('5202', '통신비',         'expense', 42),
  ('5203', '사무용품비',     'expense', 43),
  ('5204', '차량유지비',     'expense', 44),
  ('5300', '사역비',         'expense', 50),
  ('5301', '예배사역비',     'expense', 51),
  ('5302', '교육사역비',     'expense', 52),
  ('5303', '청년부',         'expense', 53),
  ('5304', '주일학교',       'expense', 54),
  ('5400', '선교비',         'expense', 60),
  ('5401', '국내선교비',     'expense', 61),
  ('5402', '해외선교비',     'expense', 62),
  ('5403', '선교사후원비',   'expense', 63),
  ('5500', '심방구제비',     'expense', 70),
  ('5600', '시설비',         'expense', 80),
  ('5601', '건물유지보수',   'expense', 81),
  ('5700', '기타지출',       'expense', 90)
ON CONFLICT (code) DO NOTHING;
