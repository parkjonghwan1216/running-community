// 서울 유명 러닝 코스 예시 데이터 시드 스크립트
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../data/app.db');
const GPX_DIR = path.join(__dirname, '../public/uploads/gpx');

fs.mkdirSync(GPX_DIR, { recursive: true });

// 하버사인 거리 계산 (km)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcDistance(points) {
  let d = 0;
  for (let i = 1; i < points.length; i++) {
    d += haversine(points[i-1][0], points[i-1][1], points[i][0], points[i][1]);
  }
  return Math.round(d * 100) / 100;
}

function calcElevationGain(elevations) {
  let gain = 0;
  for (let i = 1; i < elevations.length; i++) {
    const diff = elevations[i] - elevations[i-1];
    if (diff > 0) gain += diff;
  }
  return Math.round(gain);
}

function makeGpx(name, points, elevations) {
  const trkpts = points.map(([lat, lon], i) =>
    `      <trkpt lat="${lat.toFixed(6)}" lon="${lon.toFixed(6)}"><ele>${elevations[i].toFixed(1)}</ele></trkpt>`
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="러닝 커뮤니티" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${name}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

function makeGeoJson(points) {
  return JSON.stringify({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: points.map(([lat, lon]) => [lon, lat]),
    },
    properties: {},
  });
}

// ── 코스 1: 여의도 한강공원 루프 ──────────────────────────────────────────
// 여의나루에서 시작해 반시계 방향으로 한강 둔치를 달리는 5.4km 루프
const yeouido = (() => {
  // 주요 앵커 포인트 (lat, lon)
  const anchors = [
    [37.5244, 126.9328], // 여의나루역 입구
    [37.5261, 126.9362],
    [37.5272, 126.9410],
    [37.5268, 126.9450],
    [37.5252, 126.9476], // 동쪽 끝
    [37.5228, 126.9490],
    [37.5195, 126.9490],
    [37.5173, 126.9462], // 63빌딩 앞
    [37.5160, 126.9418],
    [37.5158, 126.9370],
    [37.5168, 126.9330],
    [37.5190, 126.9302],
    [37.5220, 126.9290],
    [37.5244, 126.9328], // 복귀
  ];
  const pts = [];
  const elev = [];
  for (let i = 0; i < anchors.length - 1; i++) {
    const [la, lo] = anchors[i];
    const [la2, lo2] = anchors[i + 1];
    const steps = 6;
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      pts.push([la + (la2 - la) * t, lo + (lo2 - lo) * t]);
      elev.push(7 + Math.sin(s * 0.8) * 1.5); // 한강 둔치 - 거의 평지
    }
  }
  pts.push(anchors[anchors.length - 1]);
  elev.push(7);
  return { pts, elev };
})();

// ── 코스 2: 남산 순환 코스 ──────────────────────────────────────────────
// 남산 공원 입구에서 시작해 N서울타워를 돌아오는 7.2km 루프 (고저차 ~220m)
const namsan = (() => {
  const anchors = [
    [37.5506, 126.9819, 50],  // 남산 공원 입구 (남대문 방향)
    [37.5492, 126.9856, 80],
    [37.5480, 126.9895, 120],
    [37.5490, 126.9930, 160],
    [37.5511, 126.9960, 195],
    [37.5530, 126.9985, 220],
    [37.5517, 126.9918, 265],  // N서울타워 근처 (정상부)
    [37.5510, 126.9875, 250],
    [37.5524, 126.9840, 200],
    [37.5535, 126.9800, 155],
    [37.5528, 126.9768, 110],
    [37.5518, 126.9790, 75],
    [37.5506, 126.9819, 50],  // 복귀
  ];
  const pts = [];
  const elev = [];
  for (let i = 0; i < anchors.length - 1; i++) {
    const [la, lo, el] = anchors[i];
    const [la2, lo2, el2] = anchors[i + 1];
    const steps = 8;
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      pts.push([la + (la2 - la) * t, lo + (lo2 - lo) * t]);
      elev.push(el + (el2 - el) * t);
    }
  }
  pts.push([anchors[anchors.length-1][0], anchors[anchors.length-1][1]]);
  elev.push(anchors[anchors.length-1][2]);
  return { pts, elev };
})();

// ── 코스 3: 올림픽공원 호수길 ────────────────────────────────────────────
// 몽촌토성역에서 시작해 올림픽공원 내부 호수를 한 바퀴 도는 4.9km 루프
const olympic = (() => {
  // 올림픽공원 중심 좌표 기준 타원 루프 생성
  const centerLat = 37.5205;
  const centerLon = 127.1219;
  const nPts = 60;
  const pts = [];
  const elev = [];
  for (let i = 0; i <= nPts; i++) {
    const angle = (2 * Math.PI * i) / nPts;
    const lat = centerLat + 0.0110 * Math.sin(angle);
    const lon = centerLon + 0.0150 * Math.cos(angle);
    pts.push([lat, lon]);
    // 살짝 언덕감 있는 공원
    elev.push(28 + 8 * Math.sin(angle * 2) + 4 * Math.cos(angle * 3));
  }
  return { pts, elev };
})();

// ── 코스 4: 청계천 이지런 ────────────────────────────────────────────────
// 청계광장에서 신답교까지 왕복 6km, 완전 평지
const cheonggyecheon = (() => {
  const startLat = 37.5703, startLon = 126.9779;
  const endLat = 37.5662, endLon = 127.0220;
  const nPts = 50;
  const pts = [];
  const elev = [];
  // 편도 25점
  for (let i = 0; i < nPts; i++) {
    const t = i / (nPts - 1);
    // 청계천은 살짝 남동향으로 굽어 있음
    const waveLat = Math.sin(t * Math.PI * 3) * 0.0008;
    const waveLon = Math.cos(t * Math.PI * 2) * 0.0005;
    pts.push([startLat + (endLat - startLat) * t + waveLat,
              startLon + (endLon - startLon) * t + waveLon]);
    elev.push(12 - t * 5); // 서울 동쪽으로 갈수록 미세하게 낮아짐
  }
  // 복귀
  for (let i = nPts - 2; i >= 0; i--) {
    pts.push([pts[i][0] + 0.0003, pts[i][1]]); // 반대편 천변
    elev.push(elev[i]);
  }
  return { pts, elev };
})();

const COURSES = [
  {
    title: '여의도 한강공원 루프',
    description: '여의나루역에서 출발해 한강 둔치를 따라 반시계 방향으로 도는 5.4km 루프 코스. 시야가 탁 트이고 경사가 거의 없어 LSD나 이지런으로 최적입니다. 해 질 녁에 달리면 노을 뷰가 일품.',
    filename: 'yeouido-loop.gpx',
    ...yeouido,
  },
  {
    title: '남산 순환 코스',
    description: '남산 공원 입구에서 시작해 N서울타워를 돌아오는 7.2km 루프. 누적 상승고도 약 220m. 경사 구간이 많아 러닝 근력과 심폐 지구력 향상에 효과적입니다. 야경을 보며 달리는 밤 러닝 명소.',
    filename: 'namsan-loop.gpx',
    ...namsan,
  },
  {
    title: '올림픽공원 호수길',
    description: '몽촌토성역 인근 올림픽공원 내부 호수를 한 바퀴 도는 4.9km 루프. 완만한 언덕과 녹지가 어우러져 회복런이나 가벼운 훈련런에 딱 맞습니다. 주말 아침엔 러너들이 많아 페이스를 맞춰 달리기도 좋음.',
    filename: 'olympic-park.gpx',
    ...olympic,
  },
  {
    title: '청계천 이지런 6km',
    description: '청계광장에서 신답교까지 편도 3km 완전 평지 코스를 왕복하는 6km 루트. 돌바닥 충격이 있어 쿠션화 추천. 도심 한복판이라 직장인 점심 런 or 출퇴근 런으로 인기. 봄 벚꽃 시즌에 특히 아름다움.',
    filename: 'cheonggyecheon-easy.gpx',
    ...cheonggyecheon,
  },
];

const db = new Database(DB_PATH);

// 첫 번째 사용자 ID 가져오기
const firstUser = db.prepare('SELECT id FROM users LIMIT 1').get();
if (!firstUser) {
  console.error('DB에 사용자가 없습니다. 서버를 한 번 실행해 시드 유저를 생성해주세요.');
  process.exit(1);
}
const authorId = firstUser.id;

const insert = db.prepare(`
  INSERT INTO courses (author_id, title, description, gpx_path, distance_km, elevation_m, geojson)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const course of COURSES) {
  const gpxContent = makeGpx(course.title, course.pts, course.elev);
  const gpxPath = `/uploads/gpx/${course.filename}`;
  fs.writeFileSync(path.join(GPX_DIR, course.filename), gpxContent, 'utf-8');

  const distanceKm = calcDistance(course.pts);
  const elevationM = calcElevationGain(course.elev);
  const geojson = makeGeoJson(course.pts);

  insert.run(authorId, course.title, course.description, gpxPath, distanceKm, elevationM, geojson);
  console.log(`✓ ${course.title}  ${distanceKm}km  +${elevationM}m`);
}

console.log('\n코스 예시 데이터 삽입 완료!');
db.close();
