import { Link } from 'react-router-dom';
import { House, CalendarDays, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
export default function Home() {
  const { user } = useAuth();
  return <><section className="intro"><p className="eyebrow">Welcome to HomeHub</p><h1>A little help for your home.</h1><p>Find home services, request an appointment, and keep your bookings in one place.</p><div className="inline-links"><Link className="button primary" to="/services">Browse services</Link><Link className="button" to={user ? '/dashboard' : '/register'}>{user ? 'Open workspace' : 'Create an account'}</Link></div></section><section><h2>How it works</h2><div className="grid"><article className="card"><House/><h3>Choose a service</h3><p>Sign in to browse service descriptions, prices, and providers.</p></article><article className="card"><CalendarDays/><h3>Request a time</h3><p>Select your home and preferred appointment. The provider reviews your request.</p></article><article className="card"><ClipboardCheck/><h3>Follow your booking</h3><p>Check status updates, read the service report, and leave a review after completion.</p></article></div></section></>;
}
