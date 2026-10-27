import test from "node:test";
import assert from "node:assert/strict";
import {
  transitions,
  validateAppointment,
  activeBooking,
} from "../src/utils/booking.js";

test("terminal booking states never expose provider transitions", () => {
  for (const status of ["CANCELLED", "COMPLETED", "EXPIRED", "REJECTED"]) {
    assert.equal(transitions[status], undefined);
    assert.equal(activeBooking(status), false);
  }
  assert.deepEqual(transitions.AWAITING_REPORT, ["COMPLETED"]);
  assert.ok(!transitions.PENDING.includes("COMPLETED"));
});
test("normal appointment notice and emergency future-time checks", () => {
  const appointment = (hours) => {
    const date = new Date(Date.now() + hours * 3600000);
    const local = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000,
    ).toISOString();
    return [local.slice(0, 10), local.slice(11, 16)];
  };
  assert.throws(() => validateAppointment(...appointment(2)), /24 hours/);
  assert.doesNotThrow(() => validateAppointment(...appointment(25)));
  assert.doesNotThrow(() => validateAppointment(...appointment(2), 0));
  assert.throws(() => validateAppointment(...appointment(-1), 0), /future/);
  assert.throws(() => validateAppointment("", ""), /select/);
});
