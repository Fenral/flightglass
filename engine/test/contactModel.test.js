/**
 * Kontaktmodell v2 — porttester for fase 5.
 * Pinner D3, D17b, D24 og F11-korreksjonen.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  strikeContact, faceCentreOffsetMm, verticalFaceHeightMm,
  CLUB_GEOMETRY, LIE_PRESETS, ballRadiusM,
} from '../src/contactModel.js';

test('F11: ballradius og sweetspot kansellerer ALDRI lenger', () => {
  // Gamle modellen: iron lift=0, r_b=0.0213, sweet=0.0213  =>  offset = -clubZ
  // Med målt sweetspot 18.4 mm kan de ikke kansellere.
  const off = faceCentreOffsetMm({
    lieHeightMm: 0, clubHeightMm: 0,
    sweetSpotHeightMm: CLUB_GEOMETRY.midIron.sweetSpotHeightMm,
  });
  assert.notEqual(off, 0, 'offset ved clubZ=0 og lie=0 må ikke være null');
  assert.ok(Math.abs(off - 2.936) < 0.01, `forventet ~2.936 mm, fikk ${off}`);
  assert.notEqual(
    CLUB_GEOMETRY.midIron.sweetSpotHeightMm, ballRadiusM * 1000,
    'sweetspot er igjen tallidentisk med ballradius — F11 har krøpet tilbake',
  );
});

test('D3: offset kan aldri overskride halve slagflaten uten at onFace blir false', () => {
  for (const [name, club] of Object.entries(CLUB_GEOMETRY)) {
    for (const lie of Object.values(LIE_PRESETS)) {
      for (let cz = -60; cz <= 60; cz += 1) {
        const r = strikeContact({
          lieHeightMm: lie, clubHeightMm: cz, club, dynamicLoftDeg: 30,
        });
        if (Math.abs(r.offsetMm) > r.halfFaceMm) {
          assert.equal(r.onFace, false,
            `${name} lie=${lie} cz=${cz}: offset ${r.offsetMm.toFixed(1)} > halv flate ${r.halfFaceMm.toFixed(1)} men onFace=true`);
        } else {
          assert.equal(r.onFace, true);
        }
      }
    }
  }
});

test('D17b: lie og køllegeometri er uavhengige akser', () => {
  const iron = CLUB_GEOMETRY.midIron;
  const drv = CLUB_GEOMETRY.driver;
  // samme lie, ulik kølle -> ulik offset
  const a = strikeContact({ lieHeightMm: 0, clubHeightMm: 0, club: iron, dynamicLoftDeg: 30 });
  const b = strikeContact({ lieHeightMm: 0, clubHeightMm: 0, club: drv, dynamicLoftDeg: 12 });
  assert.notEqual(a.offsetMm, b.offsetMm);
  // samme kølle, ulik lie -> ulik offset, differansen er nøyaktig lie-differansen
  const c = strikeContact({ lieHeightMm: 0, clubHeightMm: 0, club: iron, dynamicLoftDeg: 30 });
  const d = strikeContact({ lieHeightMm: 30, clubHeightMm: 0, club: iron, dynamicLoftDeg: 30 });
  assert.ok(Math.abs((d.offsetMm - c.offsetMm) - 30) < 1e-9,
    'lie skal forskyve offset én-til-én');
});

test('D17b: driver fra bakken er en uttrykkbar tilstand', () => {
  const r = strikeContact({
    lieHeightMm: LIE_PRESETS.hardpan, clubHeightMm: 0,
    club: CLUB_GEOMETRY.driver, dynamicLoftDeg: 12.5,
  });
  assert.ok(r.offsetMm < -10, `forventet klart under sweetspot, fikk ${r.offsetMm.toFixed(1)}`);
  assert.equal(r.onFace, true, 'den er lav, men fortsatt på flaten');
});

test('D24: begge mål returneres, og andelen er konsistent med absoluttverdien', () => {
  for (const club of Object.values(CLUB_GEOMETRY)) {
    for (const lie of Object.values(LIE_PRESETS)) {
      const r = strikeContact({ lieHeightMm: lie, clubHeightMm: 5, club, dynamicLoftDeg: 25 });
      assert.ok(Number.isFinite(r.offsetMm));
      assert.ok(Number.isFinite(r.offsetRatio));
      assert.ok(Math.abs(r.offsetRatio * r.halfFaceMm - r.offsetMm) < 1e-9);
    }
  }
});

test('jernflate måles langs flaten og projiseres vertikalt med cos(loft)', () => {
  const iron = CLUB_GEOMETRY.midIron;
  assert.equal(iron.faceConvention, 'alongFace');
  assert.ok(verticalFaceHeightMm(iron, 0) === iron.faceHeightMm, 'ved 0° loft er de like');
  const at45 = verticalFaceHeightMm(iron, 45);
  assert.ok(Math.abs(at45 - iron.faceHeightMm * Math.SQRT1_2) < 1e-9);
  assert.ok(at45 < iron.faceHeightMm, 'vertikal høyde må være lavere enn flatelengden');
  // woods måles allerede vertikalt og skal IKKE projiseres
  const drv = CLUB_GEOMETRY.driver;
  assert.equal(verticalFaceHeightMm(drv, 40), drv.faceHeightMm);
});

test('ballradius er regelverkets, ikke en avrunding', () => {
  assert.equal(ballRadiusM, 0.021336);
  assert.ok(Math.abs(ballRadiusM * 2000 - 42.672) < 1e-9, 'diameter må være 42.672 mm');
});

test('hver køllegeometri bærer sin konfidens — ingen naken verdi', () => {
  const OK = new Set(['measured', 'interpolated', 'assumed']);
  for (const [name, c] of Object.entries(CLUB_GEOMETRY)) {
    assert.ok(OK.has(c.confidence), `${name} mangler gyldig konfidens`);
    assert.ok(['vertical', 'alongFace'].includes(c.faceConvention),
      `${name} mangler måledefinisjon på faceHeight`);
  }
});
