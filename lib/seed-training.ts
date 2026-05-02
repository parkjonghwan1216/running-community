import type Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { marked } from 'marked';
import { sanitizePostHtml } from './sanitize';

interface TrainingPost {
  title: string;
  body: string;
}

const COACH_EMAIL = 'coach@runclub.local';
const COACH_NAME = '코치봇';

function ensureCoachUser(db: Database.Database): number {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(COACH_EMAIL) as
    | { id: number }
    | undefined;
  if (existing) return existing.id;
  const randomSecret = `bot-${Math.random().toString(36).slice(2)}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const hash = bcrypt.hashSync(randomSecret, 10);
  const info = db
    .prepare('INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)')
    .run(COACH_EMAIL, hash, COACH_NAME);
  return Number(info.lastInsertRowid);
}

const POSTS: TrainingPost[] = [
  {
    title: '잭 다니엘스 5가지 페이스 영역 — E/M/T/I/R 완벽 가이드',
    body: `러너의 모든 훈련 강도는 결국 다섯 영역으로 정리됩니다. 미국의 전설적 코치 잭 다니엘스(Jack Daniels)가 정리한 VDOT 시스템입니다.

## 5가지 페이스 영역

**E (Easy) — 이지 페이스**
대화가 가능한 편한 페이스. 주간 거리의 70~80%를 이 페이스로 채워야 합니다. VO2max의 약 65~78%, HRmax의 65~79%.
목적: 모세혈관/미토콘드리아 발달, 근육 회복, 심장 효율.

**M (Marathon) — 마라톤 페이스**
풀코스 목표 페이스. 75~85% 노력으로 느껴집니다.
목적: 레이스 페이스 감각, 글리코겐·지방 대사 효율.

**T (Threshold) — 역치 페이스**
"편하지만 약간 힘들다(comfortably hard)". 1시간 정도 레이스할 수 있는 강도. 83~88% 노력. 젖산 약 4 mmol/L 부근.
목적: 젖산 역치 끌어올리기. 가장 효과적인 단일 워크아웃.
세션 예시: 20~40분 템포런, 또는 5×1마일 + 1분 휴식.

**I (Interval) — 인터벌 페이스**
3~5분간 유지 가능한 강도(약 10~12분 레이스 페이스). VO2max의 95~100%.
목적: 최대 산소 섭취량 향상.
세션 예시: 5×1000m + 동일 시간 조깅 회복, 또는 6×800m.

**R (Repetition) — 반복 페이스**
1500m~1마일 레이스 페이스. 짧고 빠르게(최대 2분), 완전 회복.
목적: 러닝 이코노미와 스피드.
세션 예시: 8×400m + 400m 조깅.

## 실전 주차 구성

- 월: E + 스트라이드 6회
- 화: T (20~40분)
- 수: E
- 목: I 또는 R
- 금: 휴식 또는 E
- 토: E
- 일: 롱런 (E 페이스)

## 핵심 원칙

이지데이는 정말로 이지하게, 하드데이는 충분히 하드하게. 회색지대(중강도 매일 같은 페이스)가 가장 흔한 실수입니다.

## 출처

- Daniels, J. (2014). *Daniels' Running Formula* (3rd ed.). Human Kinetics.
- VDOT 계산기: vdoto2.com/calculator

면책: 본 글은 교육용 요약입니다. 부상/지병이 있다면 의료 전문가와 상담하세요.`,
  },
  {
    title: '러닝의 80/20 법칙 — 폴라라이즈드 트레이닝이란?',
    body: `세계 최정상 지구력 선수들의 훈련을 분석한 노르웨이 스포츠 과학자 스티븐 사일러(Stephen Seiler) 박사의 발견입니다.

## 핵심 발견

종목·국적·코칭 철학과 무관하게, 엘리트 지구력 선수의 훈련은 **약 80%를 1차 젖산 역치 이하의 저강도(Zone 1)**, **나머지 ~20%를 2차 역치 이상의 고강도(Zone 3)**로 구성됩니다. 그 사이의 중강도(Zone 2, "회색지대")는 의외로 거의 사용되지 않습니다.

## 왜 양극화인가

- **저강도(Zone 1)**: 모세혈관·미토콘드리아 적응, 회복, 누적 피로 최소화
- **고강도(Zone 3)**: VO2max·신경근 자극, 짧은 시간에 큰 적응
- **중강도(Zone 2)**: 충분히 회복되지도, 충분한 스트레스를 주지도 못해 효율이 낮음

## 메타분석 결과

지구력 종목 메타분석에서, 폴라라이즈드 분포는 임계 영역 위주 훈련(threshold-focused), 고볼륨 저강도, 또는 HIIT 단독 훈련에 비해 동등하거나 더 나은 VO2max·러닝 이코노미 향상을 보였습니다.

## 실전 적용

주간 6회 러닝 기준:
- 5회 — Easy/Long Run (Zone 1)
- 1~2회 — 인터벌/템포 (Zone 3)

쉬운 날을 정말 쉽게 달리는 게 핵심입니다. 심박/페이스를 강제로 늦추세요. 호흡으로 코로만 들이마실 수 있어야 Zone 1 신호입니다.

## 한계와 주의

엘리트 데이터에서 출발한 모델입니다. 주 3~4회 훈련하는 일반 러너는 80/20을 그대로 적용하면 자극이 부족할 수 있어, 70/30 또는 피라미드형(저-중-고 = 70/20/10)이 적합하다는 견해도 있습니다.

## 출처

- Seiler, S. (2010). What is best practice for training intensity and duration distribution in endurance athletes? *IJSPP*, 5(3), 276-291. PMID: 20861519
- Foster, C. et al. (2022). Polarized Training Is Optimal for Endurance Athletes. *MSSE*. PMID: 35136001
- Esteve-Lanao, J. et al. — 폴라라이즈드 vs 임계영역 비교 RCT (러너)

면책: 일반 정보로, 개인 코칭 자문을 대체하지 않습니다.`,
  },
  {
    title: '노르웨이 더블 쓰레숄드 — Ingebrigtsen 형제의 비밀',
    body: `2024 파리 올림픽 5000m 금메달리스트 야콥 잉에브리치센(Jakob Ingebrigtsen)을 비롯한 노르웨이 중장거리 선수들이 사용하는 훈련법입니다. 원조는 2000년대 초 마리우스 바켄(Marius Bakken).

## 핵심 아이디어

**같은 날 두 번의 임계영역(threshold) 인터벌**을 진행하되, **젖산 농도를 2.0~3.0 mmol/L로 엄격하게 제어**합니다. "최대한 빠르게"가 아니라 "대사 통제를 잃지 않을 만큼만 빠르게".

## 일반적인 주간 구성

- **화 오전**: 5×6분 인터벌 + 1분 회복 (젖산 2.5 mmol/L 목표)
- **화 오후**: 10×1000m + 30초 회복 (젖산 3.0 mmol/L 목표)
- **목**: 동일 패턴 반복 (오전 6분 인터벌, 오후 400~1000m 짧은 인터벌)
- 나머지 5일은 모두 Zone 1 이지런

전체 훈련의 75~80%는 저강도, 더블 쓰레숄드 세션은 임계영역 자극을 최대화하면서도 무산소 영역으로 넘어가지 않도록 설계됩니다.

## 왜 두 번인가

한 번의 긴 임계영역 세션보다, 같은 날 두 번 나눠 진행하면:
- 회당 강도는 낮춰도 일일 누적 자극은 더 큼
- 단일 세션 후반의 폼 붕괴/부상 위험 감소
- 다음 날 회복도 빠른 편

## 일반 러너용 적응

휴대용 젖산 측정기가 없는 일반 러너에게는 RPE 6~7/10 (편하게 힘든 강도)와 페이스/심박 기반으로 근사할 수 있습니다.

**실전 입문 버전**:
- 오전: 4×6분 (T 페이스) + 1분 조깅
- 오후 (4~6시간 후): 8×400m (T 페이스보다 약간 빠름) + 30초 조깅

처음에는 격주 1회로 시작하세요.

## 주의사항

- 누적 임계영역 부하가 매우 큽니다. 베이스가 충분치 않으면 부상·과훈련 위험.
- 하루 두 번 훈련 일정 자체가 일반 러너에게는 비현실적일 수 있습니다.
- 젖산 측정기 없이 정확한 강도 통제는 어렵습니다.

## 출처

- Bakken, M. — 원안 기록 (mariusbakken.com/the-norwegian-model.html)
- Tjelta, L. I. (2019). The training of international level distance runners. *International Journal of Sports Science & Coaching*.
- Casado, A. et al. — Norwegian double threshold method 시스템적 리뷰

면책: 고강도 누적 부하 훈련법이며, 충분한 베이스(주 60km 이상 12주+)가 전제입니다.`,
  },
  {
    title: 'Lydiard 피라미드 — 왜 베이스 빌딩이 가장 중요한가',
    body: `Runner's World가 "20세기 최고의 코치"로 선정한 뉴질랜드의 아서 라이디어드(Arthur Lydiard). 그가 창안한 주기화 모델은 현대 지구력 훈련의 청사진입니다.

## 피라미드 비유

피라미드의 밑변이 넓을수록 더 높이 쌓을 수 있습니다. 러너에게 그 밑변은 **유산소 베이스**입니다.

> "800m보다 긴 모든 레이스는 대부분 유산소 시스템을 사용한다.
>  그러므로 훈련 시간 대부분을 유산소 발달에 써야 한다." — Lydiard

## 4단계 주기화

1. **유산소 베이스 (5~10주)** — 최장 단계
   - 주 거리 점진 증가, 모두 편한 페이스(이지~스테디)
   - 일주일에 한 번 90~150분 롱런
   - 주 2~3회 스트라이드(빠른 가속)는 포함 — 신경근 유지

2. **언덕 단계 (3~4주)**
   - 주 2~3회 언덕 반복(스프링/바운딩 포함)
   - 다리 근력과 강도로의 전환 준비

3. **무산소 단계 (3~4주)**
   - 주 2~3회 인터벌(VO2max 자극)
   - 트랙 워크아웃 본격화

4. **샤프닝/테이퍼 (2~4주)**
   - 페이스 워크, 타임트라이얼, 볼륨 감소
   - 레이스 적응

## 핵심 원칙

- **베이스가 짧으면 후반 강도 단계의 효과도 작다**: 미토콘드리아·모세혈관 적응은 시간이 걸립니다.
- **베이스 단계에 강도를 섞지 말라**: 유산소 발달이 둔화됩니다. 단, 신경근 유지를 위한 짧은 스트라이드(20~30초 × 6~8회)는 OK.
- **롱런이 핵심**: 주 거리의 약 25~30%를 한 번의 롱런에 배분.

## 일반 러너 12주 모델 예시

- 1~6주: 베이스 (주 거리 +10%/주, 마지막 주 50~70km)
- 7~9주: 언덕 + 템포 도입
- 10~11주: 인터벌 (5×1000m, 4×1마일 등)
- 12주: 테이퍼

## 한계

- 부상 위험: 거리 급증 시 IT밴드, 종아리 문제 빈발 → 10% 룰 엄수
- 시간 투입: 베이스 단계에서 주 5~6일 러닝이 필요해 일반인에게 부담

## 출처

- Lydiard, A. & Gilmour, G. (1962). *Run to the Top*.
- Lydiard, A. (1999). *Running with Lydiard*.
- Magness, S. — *The Science of Running*.

면책: 거리 급증과 함께 부상 위험이 증가합니다. 점진적 증가(주 +10% 이내) 원칙을 지키세요.`,
  },
  {
    title: '180 SPM 케이던스 신화 — 무엇이 진실인가',
    body: `"케이던스는 분당 180걸음(SPM)이 정답이다"라는 말을 들어본 적 있을 겁니다. 절반은 맞고, 절반은 틀렸습니다.

## 180의 출처

잭 다니엘스가 1984 LA 올림픽 엘리트 러너들을 관찰한 결과 **레이스 페이스에서** 대부분이 180 SPM 이상이었다는 발견에서 비롯됐습니다. 그러나 이는 **빠르게 달리는 엘리트의 레이스 케이던스**일 뿐, 모든 러너의 모든 페이스에 적용되는 마법의 숫자가 아닙니다.

## 연구가 말하는 것

- **개인차가 크다**: 키, 다리 길이, 체질량, 페이스에 따라 최적 케이던스가 다릅니다. PLOS ONE 등 연구는 개인 최적 케이던스가 종종 165~175 SPM에 분포한다고 보고합니다.
- **신체 변수의 설명력은 낮다**: 키와 체질량이 케이던스 변동에서 설명하는 비율은 각각 약 24%, 8%에 불과.
- **러너는 무의식적으로 효율적인 케이던스를 선택**합니다. 의식적으로 강제로 바꾸면 오히려 산소 소비가 늘 수 있습니다.

## 그럼 뭐가 맞나

페이스에 따른 합리적 범위:
- 이지런(6:00/km 이상): 160~170 SPM
- 마라톤 페이스(5:00~6:00/km): 170~180 SPM
- 5K~10K 페이스: 180+ SPM

## 케이던스 변경의 진짜 가치

부상 예방 효과는 어느 정도 입증되어 있습니다:
- **자기 평소 케이던스의 +5~10% 증가**가 핵심 — 임의의 180을 좇지 마세요.
- 무릎 스트레스 ~20% 감소 (러닝 동작에서 무게 중심 위쪽 이동 감소)
- 경골 스트레스 골절 위험 감소

## 실전 적용

1. GPS 시계로 본인 평균 케이던스 측정 (이지런과 템포런 각각)
2. 5% 더 높은 목표 설정
3. 메트로놈 앱(예: 168 BPM)을 듣고 발놀림 맞추기
4. 4주 점진 적응 후 재측정

## 주의사항

케이던스만 올리면 보폭이 줄어 페이스가 느려질 수 있습니다. 처음 4~8주는 동일 거리·동일 페이스·높은 케이던스 적응에 집중하세요.

## 출처

- Daniels, J. (2014). *Daniels' Running Formula*.
- Heiderscheit, B. C. et al. (2011). Effects of step rate manipulation on joint mechanics during running. *MSSE*.
- Quinn, T. J. et al. (2021). Step rate vs. running velocity: cadence as a function of pace. *PLOS ONE*.

면책: 케이던스 변경은 점진적으로. 갑작스런 변화는 종아리·아킬레스 부상을 유발할 수 있습니다.`,
  },
  {
    title: '테이퍼링의 과학 — 마라톤 직전 2주, 무엇을 줄이고 무엇을 유지할까',
    body: `테이퍼링은 단순히 "쉬는" 게 아닙니다. 보스케 등(Bosquet et al.)의 메타분석은 테이퍼링의 정확한 공식을 제시했습니다.

## 메타분석의 결론 (Bosquet et al., 2007)

27개 연구를 종합한 결과:

| 변수 | 권장 |
|---|---|
| **기간** | **2주 (≤ 21일)** |
| **볼륨** | **41~60% 감소** |
| **강도** | **유지 (절대 줄이지 말 것)** |
| **빈도** | **유지** |
| **테이퍼 형태** | 점진적(progressive) 또는 단계적(step) |

평균 0.5~6.0% 퍼포먼스 향상이 관찰됐습니다. 마라톤에서 1% = 약 1~2분.

## 왜 강도는 유지해야 하나

쉬운 페이스로만 줄이면 신경근·근섬유 형질이 둔화됩니다. 짧지만 빠른 자극은 유지해야 "레이스 데이 다리"가 살아 있습니다.

## 2주 테이퍼 실전 모델 (마라톤)

**14일 전 (D-14)**
- 주 거리: 평소의 70%
- 화: 8×400m (5K 페이스)
- 목: 4×1마일 (T 페이스)
- 일: 22km 롱런 (이지)

**7일 전 (D-7)**
- 주 거리: 평소의 50%
- 화: 6×400m (5K 페이스)
- 목: 3×1마일 (M 페이스)
- 일: 12km 롱런 (이지) + 마지막 3km M 페이스

**3일 전 (D-3)**
- 30~40분 이지 + 4~6×100m 스트라이드

**2일 전 (D-2)**
- 휴식 또는 20분 워킹

**1일 전 (D-1)**
- 20~30분 가벼운 조깅 + 2~3×100m 스트라이드 (다리 깨우기)

## 흔한 실수

- ❌ 과도하게 쉬기: 3주 전부터 거의 안 달림 → 다리가 무거워짐
- ❌ 강도까지 줄이기: 인터벌·템포를 모두 빼면 폐활량 자극이 사라짐
- ❌ 마지막 주 새 워크아웃 시도: 부상 위험만 늘림
- ❌ 카브 로딩 폭식: 체중 증가, 위장 부담 → 1.5일 전부터 12~15시간 충분
- ❌ 새 신발 도전

## 멘탈 측면

테이퍼 기간에 다리가 "무겁다", "느리다"고 느껴지는 건 정상입니다(테이퍼 우울감, taper tantrums). 카운터 직전에 정상으로 돌아옵니다.

## 출처

- Bosquet, L. et al. (2007). Effects of tapering on performance: a meta-analysis. *MSSE*, 39(8), 1358-1365. PMID: 17762369
- Spilsbury, K. L. et al. (2023). Effects of tapering on performance in endurance athletes: A systematic review and meta-analysis. *PLOS ONE*. PMC10171681

면책: 개인의 훈련 부하·부상 이력에 따라 적절한 테이퍼 기간이 다릅니다.`,
  },
  {
    title: '러너에게 웨이트 트레이닝이 필요한 이유 — 러닝 이코노미 향상',
    body: `"러너는 웨이트하면 무거워진다"는 오해가 아직도 강합니다. 메타분석은 정반대를 말합니다.

## 메타분석 결과 (Balsalobre-Fernández et al., 2016)

고도로 훈련된 러너 대상 통제군 비교 메타분석에서 **스트렝스 트레이닝은 러닝 이코노미에 큰 양의 효과(large positive effect)**를 보였습니다. 평균 약 4~8% 산소 소비 감소.

쉽게 말해, 같은 페이스를 더 적은 산소로 유지할 수 있게 됩니다.

## 메커니즘

근비대(=무거워짐)가 아닙니다. 핵심은:
1. **신경근 효율(neuromuscular efficiency)**: 운동 단위 동원 패턴 개선
2. **탄성 에너지 활용**: 아킬레스건·발바닥 아치의 스프링 효과 강화
3. **폼 유지**: 후반 피로 시에도 자세 무너짐 감소
4. **부상 저항**: 둔근·코어 강화로 무릎/IT밴드 통증 감소

## 권장 프로토콜

- **빈도**: 주 2~3회
- **기간**: 8~12주 사이클
- **종류**: 저~고강도 저항 운동 + 플라이오메트릭(점프) 혼합
- **무게**: 본인 체중 + 1RM의 60~85%

### 예시 세션 (40분)

워밍업 5분 후:
- 백 스쿼트: 4×5 (1RM의 80%)
- 데드리프트: 3×5
- 한쪽 다리 데드리프트 (Single-leg RDL): 3×8
- 카프 레이즈: 3×12
- 박스 점프: 3×6
- 플랭크: 3×60초

## 타이밍

- **고강도 러닝 직후**가 일반적으로 권장 (같은 날 누적 자극)
- 또는 러닝 다음 날(별도 부하 분산)
- ❌ 인터벌·템포 직전에 하지 말 것

## 주의

- 마라톤 4주 전부터는 신규 자극 자제, 유지 강도로 전환
- 새 운동/무게는 점진적으로

## 출처

- Balsalobre-Fernández, C. et al. (2016). Effects of Strength Training on Running Economy in Highly Trained Runners: A Systematic Review With Meta-Analysis of Controlled Trials. *J Strength Cond Res*. PMID: 26694507
- Llanos-Lagos, C. et al. (2024). Effect of Strength Training Programs in Middle- and Long-Distance Runners. PMID: 38165636
- Blagrove, R. C. et al. — 러너 대상 스트렝스 트레이닝 시스템 리뷰

면책: 무거운 저항 운동은 자세가 핵심입니다. 처음에는 코치 지도하에 시작하세요.`,
  },
  {
    title: '마라톤 중 탄수화물 — 시간당 60~90g, 어떻게 먹을까',
    body: `마라톤 후반 30km에서 무너지는 가장 흔한 원인은 **글리코겐 고갈(bonking, hitting the wall)**입니다. 가장 강력한 예방책은 레이스 중 탄수화물 섭취입니다.

## 현재 권장량 (스포츠 영양 가이드라인)

| 운동 시간 | 권장 탄수화물 |
|---|---|
| 1시간 미만 | 거의 불필요 |
| 1~2.5시간 | **30~60 g/h** |
| 2.5시간 이상 | **최대 90 g/h** (멀티 트랜스포터블) |
| 엘리트 테스트 영역 | 90~120 g/h |

서브-2시간 마라톤을 위해 엘리트 남성 러너는 약 93 ± 26 g/h의 탄수화물 섭취가 필요하다는 모델 연구가 있습니다.

## 왜 90g가 가능해졌나 — 멀티 트랜스포터블

위장은 한 번에 한 종류의 당을 흡수할 때 시간당 ~60g가 한계입니다(SGLT1 트랜스포터). **포도당과 과당을 2:1 비율로 함께 섭취하면 과당이 별도 트랜스포터(GLUT5)를 사용해 추가 흡수**되어 90g까지 가능해집니다.

대부분의 현대 스포츠 젤(예: SiS Beta Fuel, Maurten 100/160)은 이 2:1 비율을 따릅니다.

## 실전 페이싱 (4시간 마라톤 기준)

목표: 시간당 60~90g → 총 240~360g

**옵션 A — 젤 위주**
- 젤 1개 ≈ 25~30g
- 매 30~35분마다 1개 (총 7~8개)
- 시작 5km 전 1개 + 10/15/20/25/30/35km

**옵션 B — 스포츠 음료 + 젤 혼합**
- 음료(6~8% CHO) 매 급수대 200ml
- 30g 젤 매 45분

## 가장 중요한 한 가지 — "장 훈련(Gut Training)"

레이스 당일 갑자기 시간당 90g를 먹으면 위경련·설사가 거의 확실합니다. **롱런 시 동일량을 시뮬레이션**하며 12주 이상 적응하세요. 장의 흡수 효율과 위 배출 속도는 훈련됩니다.

## 흔한 실수

- ❌ "괜찮을 줄 알고" 처음 써보는 젤 — 레이스 데이는 새 변수 0
- ❌ 물 없이 농축 젤만 — 위 정체 유발
- ❌ 후반에만 먹기 — 30~40분 후 흡수 → 30km 무너짐
- ❌ 카페인 과다 — 익숙치 않으면 100mg 이하로

## 출처

- Jeukendrup, A. (2014). A step towards personalized sports nutrition: carbohydrate intake during exercise. *Sports Medicine*. PMC4008807
- Stellingwerff, T. & Cox, G. R. (2014). Systematic review: Carbohydrate supplementation on exercise performance or capacity of varying durations. *Appl Physiol Nutr Metab*.
- Viribay, A. et al. (2020). Effects of 120 g/h of Carbohydrates Intake during a Mountain Marathon on Exercise-Induced Muscle Damage in Elite Runners. PMC7284742
- Burke, L. M. et al. — IOC consensus on nutrition for athletes

면책: 위장 민감도는 개인차가 매우 큽니다. 레이스 전 모든 영양 전략은 훈련 중 사전 검증되어야 합니다.`,
  },
  {
    title: '이지런 페이스가 너무 빠를 때 — 회색지대(Gray Zone)의 함정',
    body: `많은 일반 러너의 가장 큰 실수는 **이지데이가 충분히 이지하지 않은 것**입니다. 결과는 회복 부족과 자극 부족이 동시에 일어나는 "두 마리 토끼를 다 놓치는" 상태.

## 회색지대란

- **Zone 1 (저강도)**: 1차 젖산 역치 이하, 코호흡 가능, RPE 2~3/10
- **Zone 2 (중강도, "회색지대")**: 1~2차 역치 사이, "조금 힘든데 견딜 만한"
- **Zone 3 (고강도)**: 2차 역치 이상, 인터벌/템포

회색지대는:
- 이지런으로 회복하기엔 너무 강하고
- 인터벌만큼 적응 자극을 주기엔 너무 약합니다.

## 왜 이지런이 진짜 이지여야 하나

- **모세혈관·미토콘드리아 적응은 강도가 아니라 시간에 비례**합니다. 저강도로 오래 달릴수록 효과적.
- **부교감신경 회복**: 다음 하드 세션을 위한 회복은 저강도일수록 빠름.
- **부상 누적 방지**: 충격 부하가 낮음.

## "충분히 이지"를 어떻게 알까

다섯 가지 신호 중 하나라도 어긋나면 너무 빠른 겁니다:
1. **대화 테스트**: 옆 사람과 완전한 문장으로 대화 가능
2. **코호흡**: 입을 꽉 다물고 코로만 호흡 가능 (단거리 시도)
3. **심박**: HRmax의 65~75% (대략 220-나이의 65~75%)
4. **RPE**: 10점 척도 중 2~3
5. **마라톤 페이스 + 1:00~2:00/km 이상 느림**

## 흔한 함정

- 매주 같은 코스 같은 시간을 측정하다 보면 무의식 중 페이스가 빨라짐
- GPS 시계의 페이스만 보고 달림 → 강박
- 친구와 함께 달리며 자존심 → "이 정도면 이지하지" 착각

## 자기 진단 — 일주일에 같은 강도로만 달리고 있나

- 모든 러닝 페이스가 ±20초/km 안에 모여 있다 → 회색지대 함정
- 수요일 인터벌 때 전력 못 냄 → 화요일 이지런 너무 빨랐을 가능성
- 만성 피로, 수면 후에도 다리가 무거움 → 적신호

## 처방

다음 4주간:
- 이지런 페이스를 의식적으로 1:00/km 더 느리게
- 심박 캡(예: 140 bpm) 설정, 초과 시 걷기까지 허용
- 하드데이엔 정말로 하드하게 — RPE 8/10 이상

대부분의 러너는 이 4주 후 인터벌 페이스가 오히려 빨라지는 경험을 합니다.

## 출처

- Seiler, S. & Tønnessen, E. (2009). Intervals, Thresholds, and Long Slow Distance: the Role of Intensity and Duration in Endurance Training. *SSE*.
- Stöggl, T. & Sperlich, B. (2014). Polarized training has greater impact on key endurance variables than threshold, high intensity, or high volume training. *Frontiers in Physiology*.
- Magness, S. — *The Science of Running*.

면책: 일반 정보로, 개별 평가 시 코치/스포츠 의학 전문의 상담을 권합니다.`,
  },
  {
    title: '인터벌 트레이닝 — VO2max를 끌어올리는 5×1000m 공식',
    body: `VO2max(최대 산소 섭취량)는 지구력의 천장입니다. 그리고 가장 효과적인 자극은 인터벌입니다.

## 왜 3~5분 인터벌인가

VO2max에 도달하려면 산소 시스템이 100% 가동돼야 합니다. 그 상태를 누적 시간 6~12분 이상 유지하면 가장 큰 적응이 일어납니다. 한 번에 그렇게 달리는 건 거의 불가능 → 인터벌로 분할.

- **너무 짧음(<2분)**: 산소 시스템이 풀 가동되기 전에 끝남
- **너무 김(>6분)**: 강도 유지 불가, 임계영역 자극으로 변질
- **3~5분이 스위트 스팟**

## 잭 다니엘스의 I-페이스

- 강도: VO2max의 95~100%, 약 10~12분 레이스 페이스
- 최대 시간: 한 번에 5분 이내
- 회복: 인터벌과 동일 시간 또는 약간 짧게 조깅

## 핵심 워크아웃 — 5×1000m

준비:
- 본운동 전 워밍업 15~20분 + 4~6×100m 스트라이드

본운동:
- 1000m × 5회 (I 페이스)
- 회복: 400m 조깅 (~3분)
- 총 본운동 자극: ~17분

쿨다운 10~15분 이지

### 페이스 가이드 (5K 기록 기준)

| 5K 기록 | I-페이스 (1000m당) |
|---|---|
| 25:00 | 4:50 |
| 22:00 | 4:15 |
| 20:00 | 3:55 |
| 18:00 | 3:30 |
| 16:00 | 3:05 |

## 점진적 진행 (4~8주)

- 1주: 4×800m
- 2주: 5×800m
- 3주: 4×1000m
- 4주: 5×1000m
- 5주: 6×1000m 또는 4×1200m
- 6주: 5×1200m

## 흔한 실수

- ❌ 첫 1~2개를 너무 빠르게 시작 → 4번째에 무너짐. 1번째 = 마지막 ±2초가 이상적.
- ❌ 회복을 너무 짧게 → 다음 인터벌에서 강도 유지 불가
- ❌ 매주 인터벌 → 신경계 회복 부족. **주 1회**가 적정.
- ❌ 다음 날 또 하드 워크아웃 → 적응 대신 손상 누적

## 인터벌 vs 템포 — 언제 무엇을

| 목적 | 추천 |
|---|---|
| 5K~10K 레이스 준비 | 인터벌 비중 ↑ |
| 하프~풀 마라톤 준비 | 템포(T) 비중 ↑, 인터벌은 격주 |
| 베이스 부족 | 둘 다 미루고 베이스부터 |

## 출처

- Daniels, J. (2014). *Daniels' Running Formula* (3rd ed.).
- Billat, V. L. (2001). Interval training for performance: A scientific and empirical practice. *Sports Medicine*. PMID: 11219499
- Buchheit, M. & Laursen, P. B. (2013). High-intensity interval training, solutions to the programming puzzle: Part I. *Sports Medicine*.

면책: 인터벌은 부상 위험이 높은 세션입니다. 충분한 워밍업과 회복일을 반드시 동반하세요.`,
  },
];

export function seedTrainingPostsIfEmpty(db: Database.Database): void {
  const row = db.prepare(`SELECT COUNT(*) AS c FROM posts WHERE category = 'training'`).get() as {
    c: number;
  };
  if (row.c > 0) return;

  const userId = ensureCoachUser(db);
  marked.setOptions({ gfm: true, breaks: false });
  const insert = db.prepare(
    `INSERT INTO posts (category, author_id, title, body) VALUES ('training', ?, ?, ?)`,
  );
  const tx = db.transaction((rows: TrainingPost[]) => {
    for (const p of rows) {
      const html = marked.parse(p.body, { async: false }) as string;
      insert.run(userId, p.title, sanitizePostHtml(html));
    }
  });
  tx(POSTS);
}
