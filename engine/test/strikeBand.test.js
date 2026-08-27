import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  strikeBand, turfBand, teedBand, contactRegime, THRESHOLDS,
} from '../src/strikeBand.js';
import { CLUB_GEOMETRY, LIE_PRESETS, strikeContact } from '../src/contactModel.js';

const ironCases = JSON.parse(
  readFileSync(new URL('../../motor/export/studio-golden.json', import.meta.url)),
).cases.filter((r) => r.out && r.in.clubMode === 'iron');

test('turf-regelen reproduserer fixturen i minst 99 % av jerncasene', () => {
  let hit = 0;
  const miss = {};
  for (const r of ironCases) {
    const got = turfBand({
      clubHeightM: r.out.contactHeight,
      effectiveLowPointM: r.out.effectiveLowPointX,
      thetaAtImpact: r.out.thetaAtImpact,
    });
    if (got === r.out.strikeBand) {
      hit += 1;
    } else {
      const key = `${r.out.strikeBand} -> ${got}`;
      miss[key] = (miss[key] || 0) + 1;
    }
  }
  const rate = hit / ironCases.length;
  assert.ok(rate >= 0.99, `bare ${(rate * 100).toFixed(2)} % — ${JSON.stringify(miss)}`);
  // Restfeilen er kjent og dokumentert i filhodet. Vokser den, er noe endret.
  assert.ok(
    ironCases.length - hit <= 11,
    `restfeil vokst fra 11 til ${ironCases.length - hit}: ${JSON.stringify(miss)}`,
  );
});

test('whiff-terskelen er eksakt 1.4 x ballradius', () => {
  assert.ok(Math.abs(THRESHOLDS.turf.whiffClubHeightM - 1.4 * 0.0213) < 1e-15);
});

test('Pure krever alle tre akser samtidig', () => {
  const ok = { clubHeightM: 0.008, effectiveLowPointM: 0.105, thetaAtImpact: -0.05 };
  assert.equal(turfBand(ok), 'Pure');
  assert.notEqual(turfBand({ ...ok, thetaAtImpact: 0.05 }), 'Pure', 'oppadgaaende kan ikke vaere Pure');
  assert.notEqual(turfBand({ ...ok, effectiveLowPointM: 0.30 }), 'Pure', 'low point for langt foran');
  assert.notEqual(turfBand({ ...ok, effectiveLowPointM: 0.005 }), 'Pure', 'low point for naer ballen');
  assert.notEqual(turfBand({ ...ok, clubHeightM: 0.025 }), 'Pure', 'for hoey kontakt');
});

test('whiff er hoey koelle, ikke positiv offset — fortegnet som var bakvendt', () => {
  const base = { effectiveLowPointM: 0.105, thetaAtImpact: -0.05 };
  assert.equal(turfBand({ ...base, clubHeightM: 0.05 }), 'Whiff', 'hoey koelle skal bli Whiff');
  assert.notEqual(turfBand({ ...base, clubHeightM: -0.03 }), 'Whiff', 'lav koelle er aldri Whiff');
});

test('D5: turf- og teed-vokabular deler ingen ord', () => {
  const turf = new Set(['Duff', 'Fat', 'Pure', 'Thin', 'Whiff']);
  for (const w of ['OffFace', 'Low', 'Centre', 'High']) {
    assert.ok(!turf.has(w), `${w} finnes i begge vokabular`);
  }
});

test('regimet velges av underlaget, ikke av koellemerket', () => {
  assert.equal(contactRegime({ lieHeightMm: LIE_PRESETS.hardpan }), 'turf');
  assert.equal(contactRegime({ lieHeightMm: LIE_PRESETS.fairway }), 'turf');
  assert.equal(contactRegime({ lieHeightMm: LIE_PRESETS.tee }), 'teed');
});

test('begge svar returneres alltid — U1', () => {
  // driver fra bakken: perfekt turf, men lavt paa flaten. Begge maa staa.
  const r = strikeBand({
    lieHeightMm: 0, clubHeightM: 0.004, effectiveLowPointM: 0.105,
    thetaAtImpact: -0.05, offsetMm: -16.6, halfFaceMm: 27.5,
  });
  assert.equal(r.turfBand, 'Pure', 'turf-interaksjonen var ren');
  assert.equal(r.facePosition, 'Low', 'men treffet laa lavt paa flaten');
  assert.equal(r.hasTurfContact, true);
  assert.equal(r.lead, 'Pure', 'turf leder naar det er turf i spill');
});

test('teed-tilstand har ingen turfBand, men alltid flateposisjon', () => {
  const r = strikeBand({
    lieHeightMm: 30, clubHeightM: 0.004, effectiveLowPointM: 0.105,
    thetaAtImpact: -0.05, offsetMm: 13.4, halfFaceMm: 27.5,
  });
  assert.equal(r.turfBand, null, 'ingen turf i spill');
  assert.equal(r.facePosition, 'High');
  assert.equal(r.hasTurfContact, false);
  assert.equal(r.lead, 'High');
});

test('F6: ingen presentasjonsdata i retur', () => {
  const r = strikeBand({
    lieHeightMm: 8, clubHeightM: 0.005, effectiveLowPointM: 0.1,
    thetaAtImpact: -0.05, offsetMm: 3, halfFaceMm: 20,
  });
  assert.ok(!/#[0-9A-Fa-f]{6}/.test(JSON.stringify(r)), 'hex-farge i motoroutput');
  for (const k of ['color', 'textColor', 'tip', 'pct', 'barPos']) {
    assert.ok(!(k in r), `presentasjonsfeltet ${k} er tilbake`);
  }
});

test('OffFace er en egen tilstand, ikke en ekstremverdi', () => {
  assert.equal(teedBand({ offsetMm: 40, halfFaceMm: 27.5 }), 'OffFace');
  assert.equal(teedBand({ offsetMm: 27, halfFaceMm: 27.5 }), 'High');
});

test('Duff-dybden er spec 8.5 sine 25 mm', () => {
  assert.equal(THRESHOLDS.turf.duffDepthM, -0.025);
  const base = { effectiveLowPointM: 0.105, thetaAtImpact: -0.05 };
  assert.equal(turfBand({ ...base, clubHeightM: -0.026 }), 'Duff');
  assert.notEqual(turfBand({ ...base, clubHeightM: -0.024 }), 'Duff');
});

test('D5: deterministisk over hele inputrommet', () => {
  for (const lie of Object.values(LIE_PRESETS)) {
    for (const club of Object.values(CLUB_GEOMETRY)) {
      for (let cz = -0.06; cz <= 0.06; cz += 0.01) {
        const c = strikeContact({
          lieHeightMm: lie, clubHeightMm: cz * 1000, club, dynamicLoftDeg: 25,
        });
        const args = {
          lieHeightMm: lie, clubHeightM: cz, effectiveLowPointM: 0.1,
          thetaAtImpact: -0.05, offsetMm: c.offsetMm, halfFaceMm: c.halfFaceMm,
        };
        const a = strikeBand(args);
        const b = strikeBand(args);
        assert.equal(a.lead, b.lead);
        assert.equal(a.turfBand, b.turfBand);
        assert.equal(a.facePosition, b.facePosition);
        const TURF = ['Duff', 'Fat', 'Pure', 'Thin', 'Whiff'];
        const FACE = ['OffFace', 'Low', 'Centre', 'High'];
        if (a.turfBand !== null) assert.ok(TURF.includes(a.turfBand));
        assert.ok(FACE.includes(a.facePosition));
      }
    }
  }
});
