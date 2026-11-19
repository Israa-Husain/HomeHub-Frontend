import test from "node:test";
import assert from "node:assert/strict";
import {
  transitions,
  validateAppointment,
  activeBooking,
  appointmentTimestamp,
  remainingOfferSeconds,
  today,
  providerBookingActions,
  canSubmitReport,
  canApproveReschedule,
  validateProviderPeriod,
  homeownerBookingGroup,
  bookingGuidance,
  price,
  formatDateTime,
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
    const local = new Date(date.getTime() + 3 * 3600000).toISOString();
    return [local.slice(0, 10), local.slice(11, 16)];
  };
  assert.throws(() => validateAppointment(...appointment(2)), /24 hours/);
  assert.doesNotThrow(() => validateAppointment(...appointment(25)));
  assert.doesNotThrow(() => validateAppointment(...appointment(2), 0));
  assert.throws(() => validateAppointment(...appointment(-1), 0), /future/);
  assert.throws(() => validateAppointment("", ""), /select/);
});

test("Bahrain appointments and offer expiration are independent of the browser timezone", () => {
  const originalZone = process.env.TZ;
  const originalNow = Date.now;
  try {
    Date.now = () => Date.parse("2026-10-28T06:00:00Z");
    for (const zone of [
      "UTC",
      "Asia/Singapore",
      "America/Los_Angeles",
      "Asia/Bahrain",
    ]) {
      process.env.TZ = zone;
      assert.doesNotThrow(() => validateAppointment("2026-10-28", "10:00", 0));
      assert.throws(
        () => validateAppointment("2026-10-29", "08:59"),
        /24 hours/,
      );
      assert.doesNotThrow(() => validateAppointment("2026-10-29", "09:00"));
      assert.equal(remainingOfferSeconds("2026-10-28T09:15:00"), 900);
      assert.equal(
        remainingOfferSeconds(
          "2026-10-28T09:15:00.123456",
          Date.parse("2026-10-28T06:00:00.123Z"),
        ),
        900,
      );
      assert.equal(appointmentTimestamp("2026-10-28T09:00:00"), Date.now());
      assert.equal(appointmentTimestamp("2026-10-28T06:00:00Z"), Date.now());
      assert.equal(remainingOfferSeconds("2026-10-28T08:59:59"), 0);
      assert.throws(
        () => validateAppointment("2026-10-28", "09:00", 0),
        /future/,
      );
    }
    assert.equal(remainingOfferSeconds(null), null);
    assert.equal(remainingOfferSeconds("not-a-date"), null);
  } finally {
    Date.now = originalNow;
    if (originalZone === undefined) delete process.env.TZ;
    else process.env.TZ = originalZone;
  }
});

test("date picker minimum uses Bahrain's date at midnight, not the browser's date", (context) => {
  context.mock.timers.enable({
    apis: ["Date"],
    now: Date.parse("2026-10-28T21:30:00Z"),
  });
  assert.equal(today(), "2026-10-29");
});


test("homeowner groups keep server statuses distinct at Bahrain appointment boundaries", () => {
  const now = Date.parse("2026-10-28T06:00:00Z");
  const appointment = {bookingDate:"2026-10-28",startTime:"09:00:00"};
  assert.equal(homeownerBookingGroup({...appointment,status:"CONFIRMED"},now-1),"upcoming");
  assert.equal(homeownerBookingGroup({...appointment,status:"CONFIRMED"},now),"ongoing");
  assert.equal(homeownerBookingGroup({...appointment,status:"PENDING"},now),"pending");
  for(const [status,group] of [["AWAITING_REPORT","ongoing"],["COMPLETED","completed"],["CANCELLED","cancelled"],["EXPIRED","other"],["REJECTED","other"]]) {
    assert.equal(homeownerBookingGroup({...appointment,status},now),group);
  }
  assert.equal(homeownerBookingGroup({status:"CONFIRMED"},now),"other");
  assert.match(bookingGuidance({status:"PENDING",responseDeadline:"2026-10-28T09:00:00"},now),/deadline has passed/);
  assert.match(bookingGuidance({status:"PENDING",responseDeadline:"2026-10-28T09:00:01"},now),/not yet confirmed/);
});

test("BHD formatting preserves three decimal places and Bahrain deadline rollover", () => {
  assert.match(price(12.5),/BHD\s*12\.500/);
  assert.match(price(0),/BHD\s*0\.000/);
  assert.equal(price(null),"Price unavailable");
  assert.equal(formatDateTime("2026-10-28T21:30:00Z"),formatDateTime("2026-10-29T00:30:00"));
  assert.match(formatDateTime("2026-10-28T21:30:00Z"),/29 Oct 2026/);
});


test("provider actions respect response expiry, report requirements and terminal statuses", () => {
  const now = Date.parse("2026-10-28T09:00:00Z");
  const booking = {bookingDate:"2026-10-28",startTime:"11:00:00",endTime:"12:00:00",status:"CONFIRMED"};
  assert.equal(canSubmitReport(booking,now-1),false);
  assert.equal(canSubmitReport(booking,now),true);
  assert.deepEqual(providerBookingActions({...booking,status:"PENDING",responseDeadline:"2026-10-28T12:00:00"},false,now),[]);
  assert.ok(providerBookingActions({...booking,status:"PENDING",startTime:"13:00:00",responseDeadline:"2026-10-28T12:00:01"},false,now).includes("CONFIRMED"));
  assert.ok(!providerBookingActions(booking,false,now).includes("COMPLETED"));
  assert.ok(providerBookingActions(booking,true,now).includes("COMPLETED"));
  assert.ok(!providerBookingActions(booking,true,now-1).includes("COMPLETED"));
  for(const status of ["COMPLETED","CANCELLED","REJECTED","EXPIRED"]) assert.deepEqual(providerBookingActions({...booking,status},true,now),[]);
});

test("reschedule approval requires a pending eligible booking and 24 hours notice", () => {
  const now = Date.parse("2026-10-28T09:00:00Z");
  const request = {status:"PENDING",bookingStatus:"CONFIRMED",date:"2026-10-29",start:"12:00:00"};
  assert.equal(canApproveReschedule(request,now),true);
  assert.equal(canApproveReschedule(request,now+1),false);
  assert.equal(canApproveReschedule({...request,status:"APPROVED"},now),false);
  assert.equal(canApproveReschedule({...request,bookingStatus:"CANCELLED"},now),false);
});

test("provider periods use Bahrain date and compare times including seconds", context => {
  context.mock.timers.enable({apis:["Date"],now:Date.parse("2026-10-28T21:30:00Z")});
  assert.doesNotThrow(() => validateProviderPeriod("2026-10-29","09:00","10:00"));
  assert.throws(() => validateProviderPeriod("2026-10-28","09:00","10:00"),/future date/);
  assert.throws(() => validateProviderPeriod("2026-10-29","09:00","09:00:00"),/after start/);
  assert.throws(() => validateProviderPeriod("2026-10-29","23:00","01:00"),/after start/);
  assert.throws(() => validateProviderPeriod("2026-10-29","25:00","26:00"),/valid start/);
});


test("pending requests never appear in Upcoming and tab counts partition the same snapshot", () => {
  const now = Date.parse("2026-10-29T06:00:00Z");
  const rows = [
    {id:18,status:"CONFIRMED",bookingDate:"2026-10-29",startTime:"09:30:00"},
    {id:9,status:"PENDING",bookingDate:"2026-10-30",startTime:"10:00:00",responseDeadline:"2026-10-27T12:00:00"},
    {id:15,status:"PENDING",bookingDate:"2026-10-30",startTime:"11:00:00"},
    {id:3,status:"PENDING",bookingDate:"2026-10-15",startTime:"10:30:00"},
    {id:20,status:"CONFIRMED",bookingDate:"2026-10-29",startTime:"09:00:00"},
    {id:21,status:"AWAITING_REPORT"},{id:22,status:"COMPLETED"},
    {id:23,status:"CANCELLED"},{id:24,status:"REJECTED"},{id:25,status:"EXPIRED"},
    {id:26,status:"CONFIRMED"},
  ];
  const groups=["pending","upcoming","ongoing","completed","cancelled","other"];
  const counts=Object.fromEntries(groups.map(group=>[group,rows.filter(row=>homeownerBookingGroup(row,now)===group).length]));
  assert.deepEqual(counts,{pending:3,upcoming:1,ongoing:2,completed:1,cancelled:1,other:3});
  assert.equal(Object.values(counts).reduce((sum,count)=>sum+count,0),rows.length);
  assert.deepEqual(rows.filter(row=>homeownerBookingGroup(row,now)==="upcoming").map(row=>row.id),[18]);
  assert.deepEqual(rows.filter(row=>homeownerBookingGroup(row,now)==="pending").map(row=>row.id),[9,15,3]);
});

test("acceptance actions require a future Bahrain start even without a response deadline", () => {
  const now=Date.parse("2026-10-29T06:00:00Z");
  const base={status:"PENDING",bookingDate:"2026-10-29",endTime:"10:00:00"};
  for(const responseDeadline of [null,"2026-10-29T11:00:00"]){
    for(const startTime of ["08:59:59","09:00:00"]){
      const actions=providerBookingActions({...base,startTime,responseDeadline},false,now);
      assert.ok(!actions.includes("CONFIRMED"));
      assert.ok(actions.includes("REJECTED"));
      assert.ok(actions.includes("CANCELLED"));
    }
    assert.ok(providerBookingActions({...base,startTime:"09:00:01",responseDeadline},false,now).includes("CONFIRMED"));
  }
  for(const responseDeadline of ["2026-10-29T08:59:59","2026-10-29T09:00:00"])
    assert.deepEqual(providerBookingActions({...base,startTime:"10:00:00",responseDeadline},false,now),[]);
  assert.ok(!providerBookingActions(base,false,now).includes("CONFIRMED"));
});


test("pending overdue guidance identifies expired and exact response deadlines", () => {
  const now=Date.parse("2026-10-29T06:00:00Z");
  for(const responseDeadline of ["2026-10-29T08:59:59","2026-10-29T09:00:00"]){
    const booking={status:"PENDING",bookingDate:"2026-10-30",startTime:"10:00:00",responseDeadline};
    assert.equal(bookingGuidance(booking,now),"Overdue — the provider response deadline has passed. Status remains pending.");
    assert.equal(booking.status,"PENDING");
    assert.equal(homeownerBookingGroup(booking,now),"pending");
  }
});

test("pending overdue guidance covers past and exact starts without an elapsed deadline", () => {
  const now=Date.parse("2026-10-29T06:00:00Z");
  for(const responseDeadline of [null,"2026-10-29T11:00:00"]){
    for(const startTime of ["08:59:59","09:00:00"]){
      const booking={status:"PENDING",bookingDate:"2026-10-29",startTime,responseDeadline};
      assert.equal(bookingGuidance(booking,now),"Overdue — the appointment start time has passed. Status remains pending.");
      assert.equal(booking.status,"PENDING");
    }
  }
});

test("future and unknown pending times do not invent an overdue deadline", () => {
  const now=Date.parse("2026-10-29T06:00:00Z");
  for(const responseDeadline of [null,"2026-10-29T10:00:00"]){
    assert.equal(bookingGuidance({status:"PENDING",bookingDate:"2026-10-29",startTime:"09:00:01",responseDeadline},now),"Awaiting provider acceptance. This request is not yet confirmed.");
  }
  assert.equal(bookingGuidance({status:"PENDING"},now),"Awaiting provider acceptance. This request is not yet confirmed.");
});
