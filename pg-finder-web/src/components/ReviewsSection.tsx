'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { reviewsApi, type Review } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import styles from './ReviewsSection.module.css';

interface Props {
  listingId: string;
  avgRating?: number;
  reviewCount?: number;
}

export default function ReviewsSection({ listingId, avgRating = 0, reviewCount = 0 }: Props) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await reviewsApi.getForListing(listingId);
      setReviews(res.reviews ?? []);
    } catch {
      // silently fallback to empty
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a rating between 1 and 5 stars');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await reviewsApi.add(listingId, rating, comment.trim() || undefined);
      setSuccess(true);
      setComment('');
      await fetchReviews();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const displayAvg = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : Number(avgRating || 0).toFixed(1);

  const displayCount = reviews.length > 0 ? reviews.length : reviewCount;

  return (
    <div className={styles.reviewsContainer}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Ratings & Reviews</h2>
      </div>

      {/* Overview Card */}
      <div className={styles.overviewCard}>
        <div className={styles.overviewScore}>
          <span className={styles.bigRating}>{Number(displayAvg) > 0 ? displayAvg : '—'}</span>
          <div className={styles.starsRow}>
            {'★'.repeat(Math.round(Number(displayAvg)) || 0)}
            {'☆'.repeat(Math.max(0, 5 - (Math.round(Number(displayAvg)) || 0)))}
          </div>
          <span className={styles.totalCount}>
            {displayCount} {displayCount === 1 ? 'review' : 'reviews'}
          </span>
        </div>

        <div className={styles.overviewDetails}>
          <p className={styles.overviewSubtitle}>Community Feedback</p>
          <p className={styles.overviewText}>
            Ratings and reviews are from verified seekers and flatmates who have stayed at or inspected this property.
          </p>
        </div>
      </div>

      {/* Submit Review Form or Login Prompt */}
      {user ? (
        <form onSubmit={handleSubmit} className={styles.formCard}>
          <h3 className={styles.formTitle}>Leave a Review</h3>

          {error && <div className={`${styles.formAlert} ${styles.errorAlert}`}>{error}</div>}
          {success && <div className={`${styles.formAlert} ${styles.successAlert}`}>Thank you! Your review has been recorded.</div>}

          <div className={styles.starPicker}>
            <span className={styles.starPickerLabel}>Your Rating:</span>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                className={`${styles.starBtn} ${(hoverRating || rating) >= s ? styles.starActive : ''}`}
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(s)}
                aria-label={`${s} stars`}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            className={styles.commentInput}
            placeholder="Share your experience (cleanliness, food, locality, landlord behavior)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
          />

          <div className={styles.formActions}>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Submitting...' : 'Post Review'}
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.loginPrompt}>
          Want to share your review?{' '}
          <Link href="/auth/login" className={styles.loginLink}>
            Sign in to post a review
          </Link>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>💬</div>
          <p>No reviews yet for this listing. Be the first to review!</p>
        </div>
      ) : (
        <div className={styles.reviewsList}>
          {reviews.map((r) => (
            <div key={r.id} className={styles.reviewItem}>
              <div className={styles.reviewAuthorRow}>
                {r.author_photo ? (
                  <img src={r.author_photo} alt={r.author_name ?? 'User'} className={styles.avatar} />
                ) : (
                  <div className={styles.avatar}>
                    {(r.author_name || 'U')[0]?.toUpperCase()}
                  </div>
                )}
                <div className={styles.authorMeta}>
                  <p className={styles.authorName}>{r.author_name || 'Verified User'}</p>
                  <span className={styles.reviewDate}>
                    {new Date(r.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className={styles.reviewStars}>
                  {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                </div>
              </div>
              {r.comment && <p className={styles.reviewText}>{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
