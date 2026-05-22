-- 계정과목 표준안 시드 데이터
-- Phase 1 완료 후 재무 담당자 + 시무장로 검토 후 확정 (PHASES.md Phase 0 항목)

-- 수입 계정과목
INSERT INTO accounting.accounts (code, name, type, sort_order) VALUES
  ('1000', '수입', 'revenue', 10),
  ('1100', '십일조', 'revenue', 11),
  ('1200', '감사헌금', 'revenue', 12),
  ('1300', '선교헌금', 'revenue', 13),
  ('1400', '건축헌금', 'revenue', 14),
  ('1500', '특별헌금', 'revenue', 15),
  ('1600', '작정헌금', 'revenue', 16),
  ('1610', '선교작정헌금', 'revenue', 17),
  ('1620', '장학작정헌금', 'revenue', 18),
  ('1630', '복지작정헌금', 'revenue', 19),
  ('1700', '주일헌금', 'revenue', 20),
  ('1800', '기타수입', 'revenue', 21);

-- 지출 계정과목
INSERT INTO accounting.accounts (code, name, type, sort_order) VALUES
  ('2000', '지출', 'expense', 30),
  ('2100', '사역비', 'expense', 31),
  ('2110', '예배사역비', 'expense', 32),
  ('2120', '교육사역비', 'expense', 33),
  ('2130', '선교사역비', 'expense', 34),
  ('2200', '인건비', 'expense', 40),
  ('2210', '목회자사례비', 'expense', 41),
  ('2220', '직원급여', 'expense', 42),
  ('2300', '시설관리비', 'expense', 50),
  ('2310', '건물유지보수', 'expense', 51),
  ('2320', '공과금', 'expense', 52),
  ('2400', '행정비', 'expense', 60),
  ('2410', '사무용품비', 'expense', 61),
  ('2420', '통신비', 'expense', 62),
  ('2500', '선교비', 'expense', 70),
  ('2510', '국내선교비', 'expense', 71),
  ('2520', '해외선교비', 'expense', 72),
  ('2600', '구제비', 'expense', 80),
  ('2700', '교육비', 'expense', 90),
  ('2800', '기타지출', 'expense', 99);
