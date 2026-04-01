import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const TIME_SLOTS = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM",
  "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM",
];

function getDates(n = 7) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

export default function BookingModal({ provider, onClose }) {
  const { addBooking } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const dates = getDates(7);

  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newBooking, setNewBooking] = useState(null);

  const fmt = (d) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const fmtISO = (d) => {
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split("T")[0];
  };

  const isPastTimeSlot = (slot) => {
    const today = new Date();
    if (selectedDate.toDateString() !== today.toDateString()) {
      return selectedDate < new Date(today.setHours(0,0,0,0));
    }
    const [time, period] = slot.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    const slotTime = new Date();
    slotTime.setHours(hours, minutes, 0, 0);
    return slotTime < new Date();
  };

  const handleConfirm = async () => {
    if (!selectedTime) return;
    if (!user) { onClose(); navigate("/auth?mode=login"); return; }
    setLoading(true);
    try {
      const b = await addBooking({
        providerProfileId: provider.id,
        providerName: provider.name,
        service: provider.servicesOffered?.length > 0 ? provider.servicesOffered[0].category : provider.service,
        date: fmtISO(selectedDate),
        time: selectedTime,
        price: provider.servicesOffered?.length > 0 ? Math.min(...provider.servicesOffered.map(s => s.price)) : provider.price,
        notes,
      });
      setNewBooking(b);
      setConfirmed(true);
    } catch (err) {
      console.error(err);
      alert("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-0 sm:pb-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/10 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <img src={provider.avatar} alt={provider.name} className="w-10 h-10 rounded-xl bg-surface-container" />
            <div>
              <h3 className="font-bold text-on-surface">{confirmed ? "Booking Requested!" : "Book Service"}</h3>
              <p className="text-xs text-on-surface-variant">{provider.name} · {provider.service}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {confirmed ? (
          /* Success Screen */
          <div className="p-8 text-center space-y-5 animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-tertiary/20 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-tertiary text-4xl fill-icon">check_circle</span>
            </div>
            <div>
              <h4 className="font-extrabold text-xl text-on-surface mb-1">Request Sent!</h4>
              <p className="text-on-surface-variant text-sm">Your booking request has been placed. {provider.name} will confirm shortly.</p>
            </div>
            <div className="bg-surface-container-low rounded-2xl p-5 text-left space-y-3">
              {[
                { icon: "person", label: "Provider", value: provider.name },
                { icon: "build", label: "Service", value: provider.service },
                { icon: "calendar_month", label: "Date", value: fmt(selectedDate) },
                { icon: "schedule", label: "Time", value: selectedTime },
                { icon: "payments", label: "Amount", value: `₹${provider.price}` },
                { icon: "pending", label: "Status", value: "Pending Confirmation", highlight: true },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-primary">{row.icon}</span>{row.label}
                  </span>
                  <span className={`font-semibold ${row.highlight ? "text-secondary" : "text-on-surface"}`}>{row.value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { navigate("/dashboard?tab=bookings"); onClose(); }} className="flex-1 py-3 rounded-xl border border-primary/30 text-primary font-semibold text-sm hover:bg-primary/5 transition-all">
                My Bookings
              </button>
              <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary-dim transition-all">
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Date Picker */}
            <div>
              <h4 className="font-bold text-on-surface text-sm mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">calendar_month</span> Select Date
              </h4>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {dates.map((d) => {
                  const iso = fmtISO(d);
                  const sel = fmtISO(selectedDate) === iso;
                  return (
                    <button
                      key={iso}
                      onClick={() => setSelectedDate(d)}
                      className={`min-w-[72px] py-3 px-2 rounded-2xl text-center transition-all ${
                        sel ? "bg-primary text-on-primary shadow-md" : "bg-surface-container-low text-on-surface hover:bg-primary/10"
                      }`}
                    >
                      <p className="text-[10px] font-semibold uppercase opacity-70">{d.toLocaleDateString("en-IN", { weekday: "short" })}</p>
                      <p className="text-lg font-extrabold">{d.getDate()}</p>
                      <p className="text-[10px] opacity-70">{d.toLocaleDateString("en-IN", { month: "short" })}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots */}
            <div>
              <h4 className="font-bold text-on-surface text-sm mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">schedule</span> Select Time Slot
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const past = isPastTimeSlot(slot);
                  return (
                    <button
                      key={slot}
                      onClick={() => !past && setSelectedTime(slot)}
                      disabled={past}
                      className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                        past
                          ? "bg-surface-container/50 text-on-surface-variant/30 cursor-not-allowed opacity-50"
                          : selectedTime === slot
                            ? "bg-primary text-on-primary shadow-md"
                            : "bg-surface-container-low text-on-surface hover:bg-primary/10"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
              {!selectedTime && (
                <p className="text-xs text-on-surface-variant mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">info</span> Please select a time slot
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <h4 className="font-bold text-on-surface text-sm mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">notes</span> Add Notes
                <span className="text-on-surface-variant font-normal">(optional)</span>
              </h4>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe your issue or any special instructions..."
                rows={3}
                className="w-full rounded-xl border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/10 p-3 text-sm text-on-surface placeholder-on-surface-variant/50 resize-none focus:outline-none bg-surface-container-lowest"
              />
            </div>

            {/* Price Summary */}
            <div className="bg-surface-container-low rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-on-surface-variant">Service Fee</p>
                <p className="font-extrabold text-on-surface text-lg">₹{provider.servicesOffered?.length > 0 ? Math.min(...provider.servicesOffered.map(s => s.price)) : provider.price}</p>
              </div>
              <div className="text-right text-xs text-on-surface-variant space-y-0.5">
                <p>No hidden charges</p>
                <p className="flex items-center gap-1 text-tertiary font-semibold"><span className="material-symbols-outlined text-xs fill-icon">verified</span>Verified pro</p>
              </div>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              disabled={!selectedTime || loading}
              className={`w-full py-4 rounded-xl font-bold text-sm transition-all ${
                selectedTime && !loading
                  ? "bg-primary text-on-primary hover:bg-primary-dim hover:scale-[0.98]"
                  : "bg-surface-container text-on-surface-variant cursor-not-allowed"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  Sending Request...
                </span>
              ) : "Request Booking"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
