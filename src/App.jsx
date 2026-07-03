import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, MapPin, Star, Plus, X, Briefcase, Building2, ArrowRight, Sparkles, LogOut, Loader2, Image, Pencil, Trash2, Flag, Camera, User } from "lucide-react";

const SUPABASE_URL = "https://aacyfwqnlemndyojworc.supabase.co";
const SUPABASE_KEY = "sb_publishable_1m7sMwiS6GCFwSOZtqTJuQ_JrP25TGP";

const CATEGORIES_GIG = ["Web Design", "Software Development", "Graphic Design", "Social Media Management", "Content Writing", "Video Editing", "Photography", "Videography", "DJ Services", "MC / Compere", "Voice Over", "Music Production", "Hairdressing", "Barbing", "Makeup Artistry", "Nail Tech", "Gele Tying", "Fashion Design", "Tailoring", "Bead Making", "Tutoring", "Home Repairs", "Plumbing", "Electrical Work", "Carpentry", "AC Repairs", "Generator Repairs", "Phone Repairs", "Computer Repairs", "Car Wash", "Driving Services", "Delivery / Logistics", "Cleaning Services", "Laundry Services", "Catering", "Cake Baking", "Event Planning", "Event Decoration", "Interior Design", "Personal Training", "Babysitting / Nanny", "Translation Services"];
const CATEGORIES_BIZ = ["Hotels & Lounges", "Food & Snacks", "Restaurants", "Bakeries", "Fashion", "Electronics", "Salons & Spas", "Barbershops", "Event Centers", "Auto Services", "Pharmacies", "Supermarkets", "Gyms & Fitness", "Real Estate", "Furniture", "Print & Design Shops", "Laundry Services", "Logistics & Delivery"];
const LAGOS_AREAS = ["Lekki", "Ikeja", "Yaba", "Surulere", "Ogba", "Akute", "Victoria Island", "Ajah", "Ikorodu", "Festac", "Agege", "Alimosho", "Apapa", "Badagry", "Epe", "Ibeju-Lekki", "Ikotun", "Ilupeju", "Isolo", "Ketu", "Lagos Island", "Magodo", "Maryland", "Mushin", "Ojo", "Ojota", "Oshodi", "Shomolu", "Egbeda", "Gbagada"];

// ---- Minimal Supabase REST/Auth helpers (no SDK needed) ----
async function sbFetch(path, { method = "GET", body, token, headers = {} } = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token || SUPABASE_KEY}`,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.msg || data?.message || data?.error_description || "Request failed");
  return data;
}

const signUp = (email, password, full_name) =>
  sbFetch("/auth/v1/signup", { method: "POST", body: { email, password, data: { full_name } } });

const signIn = (email, password) =>
  sbFetch("/auth/v1/token?grant_type=password", { method: "POST", body: { email, password } });

const fetchListings = () =>
  sbFetch("/rest/v1/listings?select=*&order=created_at.desc");

const insertListing = (listing, token) =>
  sbFetch("/rest/v1/listings", {
    method: "POST",
    body: listing,
    token,
    headers: { Prefer: "return=representation" },
  });

const updateListing = (id, updates, token) =>
  sbFetch(`/rest/v1/listings?id=eq.${id}`, {
    method: "PATCH",
    body: updates,
    token,
    headers: { Prefer: "return=representation" },
  });

const deleteListing = (id, token) =>
  sbFetch(`/rest/v1/listings?id=eq.${id}`, { method: "DELETE", token });

const recoverPassword = (email) =>
  sbFetch("/auth/v1/recover", { method: "POST", body: { email } });

const submitReport = (listing_id, reporter_id, reason, token) =>
  sbFetch("/rest/v1/reports", { method: "POST", body: { listing_id, reporter_id, reason }, token });

const fetchReviews = () =>
  sbFetch("/rest/v1/reviews?select=listing_id,rating");

const submitReview = (listing_id, reviewer_id, rating, comment, token) =>
  sbFetch("/rest/v1/reviews", {
    method: "POST",
    body: { listing_id, reviewer_id, rating, comment: comment || null },
    token,
    headers: { Prefer: "return=representation,resolution=merge-duplicates" },
  });

async function uploadPhoto(file, userId, token) {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/photos/${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": file.type,
    },
    body: file,
  });
  if (!res.ok) throw new Error("Photo upload failed");
  return `${SUPABASE_URL}/storage/v1/object/public/photos/${path}`;
}

function GlassCard({ children, className = "", ...props }) {
  return (
    <div className={`backdrop-blur-xl bg-white/[0.06] border border-white/[0.09] rounded-2xl ${className}`} {...props}>
      {children}
    </div>
  );
}

function ListingCard({ listing, currentUserId, onEdit, onDelete, onReport, onReview, avgRating, reviewCount }) {
  const isGig = listing.type === "gig";
  const isOwner = currentUserId && listing.owner_id === currentUserId;
  return (
    <GlassCard className="overflow-hidden hover:bg-white/[0.09] transition-colors duration-300 group">
      {listing.cover_photo_url ? (
        <img src={listing.cover_photo_url} alt={listing.name} className="w-full h-36 object-cover" />
      ) : (
        <div className={`w-full h-36 flex items-center justify-center ${isGig ? "bg-amber-400/10" : "bg-emerald-400/10"}`}>
          {isGig ? <Briefcase size={28} className="text-white/15" /> : <Building2 size={28} className="text-white/15" />}
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isGig ? "bg-amber-400/15 text-amber-300" : "bg-emerald-400/15 text-emerald-300"}`}>
            {isGig ? <Briefcase size={18} /> : <Building2 size={18} />}
          </div>
          <div className="flex items-center gap-1.5">
            {isOwner && (
              <>
                <button onClick={() => onEdit(listing)} className="text-white/30 hover:text-amber-300 transition-colors" title="Edit">
                  <Pencil size={13} />
                </button>
                <button onClick={() => onDelete(listing)} className="text-white/30 hover:text-red-400 transition-colors" title="Delete">
                  <Trash2 size={13} />
                </button>
              </>
            )}
            {listing.verified ? (
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">Verified</span>
            ) : (
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full bg-white/[0.06] text-white/40 border border-white/[0.08]">New</span>
            )}
          </div>
        </div>
        <h3 className="font-display text-lg text-white/95 leading-snug mb-0.5">{listing.name}</h3>
        <p className="text-white/50 text-sm mb-2">{listing.title}</p>
        <div className="flex items-center gap-1 text-white/40 text-xs mb-2">
          <MapPin size={12} />
          <span>{listing.area}, Lagos</span>
          <span className="mx-1.5 opacity-30">•</span>
          <span className="font-mono">{listing.category}</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          {reviewCount > 0 ? (
            <button onClick={() => onReview(listing)} className="flex items-center gap-1 text-xs text-amber-300/90 hover:text-amber-300">
              <Star size={12} className="fill-amber-300 text-amber-300" /> {avgRating.toFixed(1)} ({reviewCount})
            </button>
          ) : (
            <button onClick={() => onReview(listing)} className="text-xs text-white/30 hover:text-white/60">
              No reviews yet — be the first
            </button>
          )}
          {listing.portfolio_link && (
            <a
              href={listing.portfolio_link.startsWith("http") ? listing.portfolio_link : `https://${listing.portfolio_link}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70"
            >
              <Image size={12} /> Portfolio
            </a>
          )}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.07]">
          <span className="font-mono text-emerald-300 text-sm">{listing.rate || "Contact for price"}<span className="text-white/30">{listing.rate_unit || ""}</span></span>
          <div className="flex items-center gap-3">
            {!isOwner && (
              <button onClick={() => onReport(listing)} className="text-white/25 hover:text-red-400 transition-colors" title="Report">
                <Flag size={12} />
              </button>
            )}
            {listing.whatsapp ? (
              <a
                href={`https://wa.me/${listing.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${listing.name}, I saw your listing on Hive9ja for "${listing.title}" and I'm interested.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-white/70 group-hover:text-amber-300 flex items-center gap-1 transition-colors"
              >
                Contact <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
            ) : (
              <span className="text-xs text-white/30">No contact info</span>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export default function Hive9ja() {
  const [mode, setMode] = useState("gig");
  const [query, setQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showPostModal, setShowPostModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState("signin");
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [user, setUser] = useState(null); // { id, email, token, full_name }
  const [authForm, setAuthForm] = useState({ email: "", password: "", full_name: "" });
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [postForm, setPostForm] = useState({ name: "", title: "", category: "", area: "Lekki", rate: "", whatsapp: "", portfolio_link: "" });
  const [postBusy, setPostBusy] = useState(false);
  const [postError, setPostError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [myListingsOnly, setMyListingsOnly] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const loadListings = useCallback(async () => {
    setLoadingListings(true);
    setLoadError("");
    try {
      const [data, reviewData] = await Promise.all([fetchListings(), fetchReviews().catch(() => [])]);
      setListings(data || []);
      setReviews(reviewData || []);
    } catch (e) {
      setLoadError("Couldn't load listings. Check your Supabase connection.");
    } finally {
      setLoadingListings(false);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (l.type !== mode) return false;
      if (myListingsOnly && l.owner_id !== user?.id) return false;
      if (areaFilter !== "All" && l.area !== areaFilter) return false;
      if (categoryFilter !== "All" && l.category !== categoryFilter) return false;
      if (query && !`${l.name} ${l.title} ${l.category}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [listings, mode, areaFilter, categoryFilter, query, myListingsOnly, user]);

  const ratingStats = useMemo(() => {
    const stats = {};
    reviews.forEach((r) => {
      if (!stats[r.listing_id]) stats[r.listing_id] = { sum: 0, count: 0 };
      stats[r.listing_id].sum += r.rating;
      stats[r.listing_id].count += 1;
    });
    return stats;
  }, [reviews]);

  const categories = mode === "gig" ? CATEGORIES_GIG : CATEGORIES_BIZ;

  async function handleAuth(e) {
    e.preventDefault();
    if (forgotMode) {
      setAuthBusy(true);
      setAuthError("");
      try {
        await recoverPassword(authForm.email);
        setForgotSent(true);
      } catch (err) {
        setAuthError(err.message || "Couldn't send reset email");
      } finally {
        setAuthBusy(false);
      }
      return;
    }
    setAuthBusy(true);
    setAuthError("");
    try {
      if (authTab === "signup") {
        const data = await signUp(authForm.email, authForm.password, authForm.full_name);
        if (data?.access_token) {
          setUser({ id: data.user.id, email: data.user.email, token: data.access_token, full_name: authForm.full_name });
          setShowAuthModal(false);
          setShowPostModal(true);
        } else {
          setAuthError("Account created — check your email to confirm, then sign in.");
          setAuthTab("signin");
        }
      } else {
        const data = await signIn(authForm.email, authForm.password);
        setUser({ id: data.user.id, email: data.user.email, token: data.access_token, full_name: data.user.user_metadata?.full_name || data.user.email });
        setShowAuthModal(false);
      }
      setAuthForm({ email: "", password: "", full_name: "" });
    } catch (err) {
      setAuthError(err.message || "Something went wrong");
    } finally {
      setAuthBusy(false);
    }
  }

  function handleSignOut() {
    setUser(null);
  }

  async function handlePost(e) {
    e.preventDefault();
    if (!user) {
      setShowPostModal(false);
      setShowAuthModal(true);
      return;
    }
    if (!postForm.name || !postForm.title || !postForm.category) return;
    setPostBusy(true);
    setPostError("");
    try {
      let cover_photo_url;
      if (coverFile) {
        cover_photo_url = await uploadPhoto(coverFile, user.id, user.token);
      }
      const payload = {
        type: mode,
        name: postForm.name,
        title: postForm.title,
        category: postForm.category,
        area: postForm.area,
        rate: postForm.rate || null,
        whatsapp: postForm.whatsapp || null,
        portfolio_link: postForm.portfolio_link || null,
        ...(cover_photo_url ? { cover_photo_url } : {}),
      };
      if (editingId) {
        const [updated] = await updateListing(editingId, payload, user.token);
        setListings(listings.map((l) => (l.id === editingId ? updated : l)));
      } else {
        const [created] = await insertListing({ ...payload, owner_id: user.id }, user.token);
        setListings([created, ...listings]);
      }
      setPostForm({ name: "", title: "", category: "", area: "Lekki", rate: "", whatsapp: "", portfolio_link: "" });
      setCoverFile(null);
      setEditingId(null);
      setShowPostModal(false);
    } catch (err) {
      setPostError(err.message || "Couldn't save listing");
    } finally {
      setPostBusy(false);
    }
  }

  function openEdit(listing) {
    setMode(listing.type);
    setEditingId(listing.id);
    setPostForm({
      name: listing.name || "",
      title: listing.title || "",
      category: listing.category || "",
      area: listing.area || "Lekki",
      rate: listing.rate || "",
      whatsapp: listing.whatsapp || "",
      portfolio_link: listing.portfolio_link || "",
    });
    setShowPostModal(true);
  }

  async function handleDelete(listing) {
    if (!user) return;
    if (!confirm(`Delete "${listing.name}"? This can't be undone.`)) return;
    try {
      await deleteListing(listing.id, user.token);
      setListings(listings.filter((l) => l.id !== listing.id));
    } catch (err) {
      alert(err.message || "Couldn't delete listing");
    }
  }

  async function handleReportSubmit(e) {
    e.preventDefault();
    if (!user) {
      setReportTarget(null);
      setShowAuthModal(true);
      return;
    }
    setReportBusy(true);
    try {
      await submitReport(reportTarget.id, user.id, reportReason, user.token);
      setReportTarget(null);
      setReportReason("");
    } catch (err) {
      alert(err.message || "Couldn't submit report");
    } finally {
      setReportBusy(false);
    }
  }

  async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!user) {
      setReviewTarget(null);
      setShowAuthModal(true);
      return;
    }
    setReviewBusy(true);
    try {
      await submitReview(reviewTarget.id, user.id, reviewRating, reviewComment, user.token);
      setReviews([...reviews, { listing_id: reviewTarget.id, rating: reviewRating }]);
      setReviewTarget(null);
      setReviewComment("");
      setReviewRating(5);
    } catch (err) {
      alert(err.message || "Couldn't submit review");
    } finally {
      setReviewBusy(false);
    }
  }

  return (
    <div className="min-h-screen w-full text-white" style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(11,61,46,0.55), transparent), linear-gradient(180deg, #0A0E0C 0%, #0D1310 100%)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        body, .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      <div className="font-body max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-amber-400 flex items-center justify-center">
              <Sparkles size={16} className="text-black" />
            </div>
            <span className="font-display text-xl tracking-tight">Hive9ja</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => setMyListingsOnly(!myListingsOnly)}
                  className={`hidden sm:flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${myListingsOnly ? "bg-amber-400 text-black border-amber-400" : "border-white/15 text-white/50 hover:border-white/30"}`}
                >
                  <User size={12} /> My listings
                </button>
                <span className="text-xs text-white/50 hidden sm:inline">{user.full_name}</span>
                <button onClick={handleSignOut} className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white/90 transition-colors">
                  <LogOut size={14} /> Sign out
                </button>
              </>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="text-sm text-white/60 hover:text-white/90 transition-colors">
                Sign in
              </button>
            )}
            <button
              onClick={() => (user ? setShowPostModal(true) : setShowAuthModal(true))}
              className="flex items-center gap-1.5 text-sm font-medium bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] rounded-full px-4 py-2 transition-colors"
            >
              <Plus size={15} /> List yourself
            </button>
          </div>
        </header>

        {/* Hero */}
        <section className="mb-12">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300/70 mb-4">Lagos, Nigeria</p>
          <h1 className="font-display text-4xl md:text-6xl leading-[1.05] mb-4 max-w-3xl">
            Find hustle.<br />Find hustlers.
          </h1>
          <p className="text-white/50 text-lg max-w-xl mb-8">
            The hive where Nigerian youth hire each other, get hired, and find real local businesses — no middleman, no wahala.
          </p>

          <GlassCard className="p-2 max-w-2xl">
            <div className="flex gap-1 mb-2">
              <button
                onClick={() => { setMode("gig"); setCategoryFilter("All"); }}
                className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-xl transition-all ${mode === "gig" ? "bg-amber-400 text-black" : "text-white/60 hover:text-white/90"}`}
              >
                <Briefcase size={15} /> Hire a skill
              </button>
              <button
                onClick={() => { setMode("biz"); setCategoryFilter("All"); }}
                className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-xl transition-all ${mode === "biz" ? "bg-emerald-400 text-black" : "text-white/60 hover:text-white/90"}`}
              >
                <Building2 size={15} /> Find a business
              </button>
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-black/20 rounded-xl">
              <Search size={16} className="text-white/40 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={mode === "gig" ? "Try 'web design' or 'makeup'..." : "Try 'hotel' or 'snacks'..."}
                className="bg-transparent outline-none text-sm w-full placeholder:text-white/30"
              />
            </div>
          </GlassCard>

          <div className="flex flex-wrap gap-3 mt-4">
            <div className="relative">
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="appearance-none text-xs font-mono pl-3 pr-8 py-2 rounded-full border border-white/15 bg-white/[0.04] text-white/70 outline-none focus:border-emerald-400/50 cursor-pointer"
              >
                <option value="All" className="bg-[#0D1310]">All areas</option>
                {LAGOS_AREAS.map((a) => (
                  <option key={a} value={a} className="bg-[#0D1310]">{a}</option>
                ))}
              </select>
              <MapPin size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
            </div>
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none text-xs font-mono pl-3 pr-8 py-2 rounded-full border border-white/15 bg-white/[0.04] text-white/70 outline-none focus:border-emerald-400/50 cursor-pointer"
              >
                <option value="All" className="bg-[#0D1310]">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-[#0D1310]">{c}</option>
                ))}
              </select>
              <Search size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
            </div>
            {(areaFilter !== "All" || categoryFilter !== "All") && (
              <button
                onClick={() => { setAreaFilter("All"); setCategoryFilter("All"); }}
                className="text-xs font-mono px-3 py-2 rounded-full border border-white/10 text-white/40 hover:text-white/70 hover:border-white/25 transition-colors flex items-center gap-1"
              >
                <X size={12} /> Clear filters
              </button>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-white/80">
              {loadingListings
                ? "Loading..."
                : myListingsOnly
                ? `${filtered.length} of your ${mode === "gig" ? "gig" : "business"} listing${filtered.length !== 1 ? "s" : ""}`
                : `${filtered.length} ${mode === "gig" ? "hustler" : "business"}${filtered.length !== 1 ? "s" : ""} found`}
            </h2>
          </div>

          {loadingListings ? (
            <GlassCard className="p-10 text-center text-white/40 flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Loading listings from Hive9ja...
            </GlassCard>
          ) : loadError ? (
            <GlassCard className="p-10 text-center text-red-300/80 text-sm">{loadError}</GlassCard>
          ) : filtered.length === 0 ? (
            <GlassCard className="p-10 text-center text-white/40">
              {myListingsOnly ? "You haven't posted anything in this category yet." : "Nothing here yet. Be the first to list in this category."}
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  currentUserId={user?.id}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onReport={(listing) => (user ? setReportTarget(listing) : setShowAuthModal(true))}
                  onReview={(listing) => (user ? setReviewTarget(listing) : setShowAuthModal(true))}
                  avgRating={ratingStats[l.id] ? ratingStats[l.id].sum / ratingStats[l.id].count : 0}
                  reviewCount={ratingStats[l.id]?.count || 0}
                />
              ))}
            </div>
          )}
        </section>

        <footer className="mt-20 pt-6 border-t border-white/[0.06] text-center text-white/25 text-xs font-mono">
          Hive9ja — connected to live database · QD Designs
        </footer>
      </div>

      {/* Auth modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50" onClick={() => { setShowAuthModal(false); setForgotMode(false); setForgotSent(false); }}>
          <GlassCard className="w-full max-w-md p-6 bg-[#0D1310]/95" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl">{forgotMode ? "Reset password" : authTab === "signin" ? "Sign in" : "Create account"}</h3>
              <button onClick={() => { setShowAuthModal(false); setForgotMode(false); setForgotSent(false); }} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>
            {forgotMode ? (
              forgotSent ? (
                <div className="text-center py-4">
                  <p className="text-sm text-white/70 mb-4">Check your email for a password reset link.</p>
                  <button onClick={() => { setForgotMode(false); setForgotSent(false); }} className="text-xs text-emerald-300 hover:text-emerald-200">
                    Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAuth} className="space-y-3">
                  <input
                    type="email"
                    placeholder="Your email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-400/50"
                    required
                  />
                  {authError && <p className="text-xs text-amber-300">{authError}</p>}
                  <button type="submit" disabled={authBusy} className="w-full bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60 text-black font-medium text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                    {authBusy && <Loader2 size={14} className="animate-spin" />} Send reset link
                  </button>
                  <button type="button" onClick={() => setForgotMode(false)} className="w-full text-xs text-white/40 hover:text-white/70">
                    Back to sign in
                  </button>
                </form>
              )
            ) : (
              <>
                <div className="flex gap-1 mb-4 bg-black/20 rounded-xl p-1">
                  <button onClick={() => setAuthTab("signin")} className={`flex-1 text-xs py-2 rounded-lg ${authTab === "signin" ? "bg-emerald-400 text-black" : "text-white/50"}`}>Sign in</button>
                  <button onClick={() => setAuthTab("signup")} className={`flex-1 text-xs py-2 rounded-lg ${authTab === "signup" ? "bg-emerald-400 text-black" : "text-white/50"}`}>Sign up</button>
                </div>
                <form onSubmit={handleAuth} className="space-y-3">
                  {authTab === "signup" && (
                    <input
                      placeholder="Full name"
                      value={authForm.full_name}
                      onChange={(e) => setAuthForm({ ...authForm, full_name: e.target.value })}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-400/50"
                      required
                    />
                  )}
                  <input
                    type="email"
                    placeholder="Email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-400/50"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password (min 6 characters)"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-400/50"
                    minLength={6}
                    required
                  />
                  {authTab === "signin" && (
                    <button type="button" onClick={() => setForgotMode(true)} className="text-xs text-white/40 hover:text-white/70">
                      Forgot password?
                    </button>
                  )}
                  {authError && <p className="text-xs text-amber-300">{authError}</p>}
                  <button type="submit" disabled={authBusy} className="w-full bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60 text-black font-medium text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                    {authBusy && <Loader2 size={14} className="animate-spin" />}
                    {authTab === "signin" ? "Sign in" : "Create account"}
                  </button>
                </form>
              </>
            )}
          </GlassCard>
        </div>
      )}

      {/* Post listing modal */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50" onClick={() => { setShowPostModal(false); setEditingId(null); setCoverFile(null); }}>
          <GlassCard className="w-full max-w-md p-6 bg-[#0D1310]/95 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl">{editingId ? "Edit listing" : "List on Hive9ja"}</h3>
              <button onClick={() => { setShowPostModal(false); setEditingId(null); setCoverFile(null); }} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="flex gap-1 mb-4 bg-black/20 rounded-xl p-1">
              <button type="button" disabled={!!editingId} onClick={() => setMode("gig")} className={`flex-1 text-xs py-2 rounded-lg disabled:opacity-40 ${mode === "gig" ? "bg-amber-400 text-black" : "text-white/50"}`}>Skill / Gig</button>
              <button type="button" disabled={!!editingId} onClick={() => setMode("biz")} className={`flex-1 text-xs py-2 rounded-lg disabled:opacity-40 ${mode === "biz" ? "bg-emerald-400 text-black" : "text-white/50"}`}>Business</button>
            </div>
            <form onSubmit={handlePost} className="space-y-3">
              <label className="flex items-center gap-2 text-xs text-white/50 border border-dashed border-white/15 rounded-lg px-3 py-2.5 cursor-pointer hover:border-white/30">
                <Camera size={14} />
                {coverFile ? coverFile.name : "Add a cover photo (optional but recommended)"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
              </label>
              <input
                placeholder={mode === "gig" ? "Your name" : "Business name"}
                value={postForm.name}
                onChange={(e) => setPostForm({ ...postForm, name: e.target.value })}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-400/50"
                required
              />
              <input
                placeholder={mode === "gig" ? "What you do (e.g. Logo Design)" : "What you offer (e.g. Rooms & Bar)"}
                value={postForm.title}
                onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-400/50"
                required
              />
              <select
                value={postForm.category}
                onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-400/50"
                required
              >
                <option value="">Select category</option>
                {categories.map((c) => <option key={c} value={c} className="bg-[#0D1310]">{c}</option>)}
              </select>
              <div className="flex gap-2">
                <select
                  value={postForm.area}
                  onChange={(e) => setPostForm({ ...postForm, area: e.target.value })}
                  className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-400/50"
                >
                  {LAGOS_AREAS.map((a) => <option key={a} value={a} className="bg-[#0D1310]">{a}</option>)}
                </select>
                <input
                  placeholder="Rate (e.g. ₦10,000)"
                  value={postForm.rate}
                  onChange={(e) => setPostForm({ ...postForm, rate: e.target.value })}
                  className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-400/50"
                />
              </div>
              <input
                placeholder="WhatsApp number (e.g. 2348012345678)"
                value={postForm.whatsapp}
                onChange={(e) => setPostForm({ ...postForm, whatsapp: e.target.value })}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-400/50"
              />
              <p className="text-[11px] text-white/30 -mt-1">Country code + number, no + or spaces. This is how people reach you.</p>
              {mode === "gig" && (
                <input
                  placeholder="Portfolio link (Instagram, Drive, Behance...)"
                  value={postForm.portfolio_link}
                  onChange={(e) => setPostForm({ ...postForm, portfolio_link: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-400/50"
                />
              )}
              {postError && <p className="text-xs text-amber-300">{postError}</p>}
              <button type="submit" disabled={postBusy} className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-black font-medium text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                {postBusy && <Loader2 size={14} className="animate-spin" />}
                {editingId ? "Save changes" : "Post listing"}
              </button>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Report modal */}
      {reportTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50" onClick={() => setReportTarget(null)}>
          <GlassCard className="w-full max-w-md p-6 bg-[#0D1310]/95" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl">Report listing</h3>
              <button onClick={() => setReportTarget(null)} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-white/40 mb-4">Reporting "{reportTarget.name}" — {reportTarget.title}</p>
            <form onSubmit={handleReportSubmit} className="space-y-3">
              <textarea
                placeholder="What's wrong with this listing?"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={3}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-400/50 resize-none"
                required
              />
              <button type="submit" disabled={reportBusy} className="w-full bg-red-400/90 hover:bg-red-400 disabled:opacity-60 text-black font-medium text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                {reportBusy && <Loader2 size={14} className="animate-spin" />} Submit report
              </button>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Review modal */}
      {reviewTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50" onClick={() => setReviewTarget(null)}>
          <GlassCard className="w-full max-w-md p-6 bg-[#0D1310]/95" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl">Rate "{reviewTarget.name}"</h3>
              <button onClick={() => setReviewTarget(null)} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setReviewRating(n)}>
                    <Star size={26} className={n <= reviewRating ? "fill-amber-300 text-amber-300" : "text-white/20"} />
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Optional comment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-400/50 resize-none"
              />
              <button type="submit" disabled={reviewBusy} className="w-full bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60 text-black font-medium text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                {reviewBusy && <Loader2 size={14} className="animate-spin" />} Submit review
              </button>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
