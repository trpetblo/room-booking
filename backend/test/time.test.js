const { expect } = require('chai');
const { validateSlot, overlaps, toMinutes, toHHMM } = require('../utils/time');

describe('booking time rules', () => {
  it('accepts a slot inside business hours', () => {
    const r = validateSlot('2026-11-20', '09:00', '10:30');
    expect(r).to.deep.equal({ startMinutes: 540, endMinutes: 630 });
  });

  it('accepts the full business day 07:00 to 18:00', () => {
    expect(validateSlot('2026-11-20', '07:00', '18:00').error).to.equal(undefined);
  });

  it('rejects a start before 07:00', () => {
    expect(validateSlot('2026-11-20', '06:30', '08:00').error).to.match(/business hours/);
  });

  it('rejects an end after 18:00', () => {
    expect(validateSlot('2026-11-20', '17:00', '18:30').error).to.match(/business hours/);
  });

  it('rejects end time not after start time', () => {
    expect(validateSlot('2026-11-20', '10:00', '10:00').error).to.match(/after start/);
    expect(validateSlot('2026-11-20', '11:00', '10:00').error).to.match(/after start/);
  });

  it('rejects bad dates and times', () => {
    expect(validateSlot('20-11-2026', '09:00', '10:00').error).to.match(/Date/);
    expect(validateSlot('2026-02-30', '09:00', '10:00').error).to.match(/Date/);
    expect(validateSlot('2026-11-20', '9am', '10:00').error).to.match(/HH:MM/);
  });

  it('converts between HH:MM and minutes', () => {
    expect(toMinutes('07:05')).to.equal(425);
    expect(toHHMM(425)).to.equal('07:05');
  });
});

describe('overlap rule', () => {
  it('detects overlapping slots', () => {
    expect(overlaps(540, 600, 570, 630)).to.equal(true); // 9:00-10:00 vs 9:30-10:30
    expect(overlaps(540, 660, 570, 600)).to.equal(true); // one inside the other
  });

  it('allows back-to-back slots', () => {
    expect(overlaps(540, 600, 600, 660)).to.equal(false);
  });

  it('allows separate slots', () => {
    expect(overlaps(540, 600, 700, 760)).to.equal(false);
  });
});
