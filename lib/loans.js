const { ObjectId } = require("mongodb");

function httpError(status, message) {
  const error = new Error(message);
  error.httpStatus = status;
  return error;
}

async function issueReservationLoan({ db, client, reservationId, reviewer, expectedStatus }) {
  if (!ObjectId.isValid(reservationId)) throw httpError(400, "Reservation ID is invalid.");
  await db.collection("loans").createIndex(
    { reservationId: 1 },
    { unique: true, partialFilterExpression: { reservationId: { $type: "string" } } }
  );

  const session = client.startSession();
  try {
    return await session.withTransaction(async () => {
      const reservations = db.collection("reservations");
      const loans = db.collection("loans");
      const books = db.collection("books");
      const reservation = await reservations.findOne(
        { _id: new ObjectId(reservationId), status: expectedStatus, loanId: { $exists: false } },
        { session }
      );
      if (!reservation) throw httpError(409, "This request is no longer eligible for checkout.");
      if (!ObjectId.isValid(reservation.bookId) || !ObjectId.isValid(reservation.userId)) {
        throw httpError(409, "The request is missing a valid member or book.");
      }

      const now = new Date();
      const book = await books.findOneAndUpdate(
        { _id: new ObjectId(reservation.bookId), status: "active", available: { $gt: 0 } },
        { $inc: { available: -1 }, $set: { updatedAt: now } },
        { session, returnDocument: "after" }
      );
      if (!book) throw httpError(409, "No copy of this book is currently available.");

      const member = await db.collection("users").findOne(
        { _id: new ObjectId(reservation.userId), status: { $ne: "disabled" } },
        { session, projection: { passwordHash: 0 } }
      );
      if (!member) throw httpError(409, "The member account is unavailable.");

      const settings = await db.collection("settings").findOne({ _id: "library" }, { session, projection: { loanPeriod: 1 } });
      const loanPeriod = [7, 14, 21].includes(Number(settings?.loanPeriod)) ? Number(settings.loanPeriod) : 14;
      const loanId = new ObjectId();
      const loan = {
        _id: loanId,
        reservationId: String(reservation._id),
        bookId: String(book._id),
        title: book.title,
        author: book.author,
        userId: String(member._id),
        user: member.name,
        email: member.email,
        status: "borrowed",
        checkedOutAt: now,
        dueAt: new Date(now.getTime() + loanPeriod * 86400000),
        createdAt: now,
        updatedAt: now
      };
      await loans.insertOne(loan, { session });

      const reservationUpdates = {
        loanId: String(loanId),
        updatedAt: now
      };
      if (expectedStatus === "pending") {
        Object.assign(reservationUpdates, { status: "approved", reviewedAt: now, reviewedBy: reviewer.name });
      }
      const updated = await reservations.updateOne(
        { _id: reservation._id, status: expectedStatus, loanId: { $exists: false } },
        { $set: reservationUpdates },
        { session }
      );
      if (!updated.matchedCount) throw httpError(409, "This request was already handled.");
      return { ...loan, _id: String(loanId) };
    }, { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });
  } finally {
    await session.endSession();
  }
}

module.exports = { issueReservationLoan };
