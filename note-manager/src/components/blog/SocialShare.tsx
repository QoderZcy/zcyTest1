// Social sharing components

import React, { useState } from 'react';
import { 
  Share, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Link, 
  Mail, 
  MessageCircle,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  hashtags?: string[];
  className?: string;
  variant?: 'default' | 'minimal' | 'detailed';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export const SocialShare: React.FC<SocialShareProps> = ({
  url,
  title,
  description = '',
  hashtags = [],
  className = '',
  variant = 'default',
  size = 'md',
  showLabels = false
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const hashtagString = hashtags.map(tag => `#${tag}`).join(' ');

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}${hashtagString ? `&hashtags=${hashtags.join(',')}` : ''}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0D%0A%0D%0A${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      setShowMenu(!showMenu);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const openShareWindow = (shareUrl: string) => {
    window.open(
      shareUrl,
      'share',
      'width=600,height=400,scrollbars=yes,resizable=yes'
    );
  };

  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24
  }[size];

  if (variant === 'minimal') {
    return (
      <div className={`social-share minimal ${size} ${className}`}>
        <button
          onClick={handleNativeShare}
          className="share-trigger"
          title="Share"
        >
          <Share size={iconSize} />
        </button>

        {showMenu && (
          <div className="share-menu">
            <button
              onClick={() => openShareWindow(shareLinks.twitter)}
              className="share-item twitter"
            >
              <Twitter size={14} />
            </button>
            <button
              onClick={() => openShareWindow(shareLinks.facebook)}
              className="share-item facebook"
            >
              <Facebook size={14} />
            </button>
            <button
              onClick={() => openShareWindow(shareLinks.linkedin)}
              className="share-item linkedin"
            >
              <Linkedin size={14} />
            </button>
            <button
              onClick={handleCopyLink}
              className={`share-item copy ${copySuccess ? 'success' : ''}`}
            >
              {copySuccess ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        )}

        {showMenu && (
          <div 
            className="share-backdrop"
            onClick={() => setShowMenu(false)}
          />
        )}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`social-share detailed ${size} ${className}`}>
        <h4>Share this post</h4>
        
        <div className="share-buttons">
          <button
            onClick={() => openShareWindow(shareLinks.twitter)}
            className="share-btn twitter"
          >
            <Twitter size={iconSize} />
            <div className="share-content">
              <span className="platform">Twitter</span>
              <span className="description">Share on Twitter</span>
            </div>
          </button>

          <button
            onClick={() => openShareWindow(shareLinks.facebook)}
            className="share-btn facebook"
          >
            <Facebook size={iconSize} />
            <div className="share-content">
              <span className="platform">Facebook</span>
              <span className="description">Share on Facebook</span>
            </div>
          </button>

          <button
            onClick={() => openShareWindow(shareLinks.linkedin)}
            className="share-btn linkedin"
          >
            <Linkedin size={iconSize} />
            <div className="share-content">
              <span className="platform">LinkedIn</span>
              <span className="description">Share on LinkedIn</span>
            </div>
          </button>

          <button
            onClick={() => openShareWindow(shareLinks.whatsapp)}
            className="share-btn whatsapp"
          >
            <MessageCircle size={iconSize} />
            <div className="share-content">
              <span className="platform">WhatsApp</span>
              <span className="description">Share on WhatsApp</span>
            </div>
          </button>

          <button
            onClick={() => window.location.href = shareLinks.email}
            className="share-btn email"
          >
            <Mail size={iconSize} />
            <div className="share-content">
              <span className="platform">Email</span>
              <span className="description">Share via email</span>
            </div>
          </button>

          <button
            onClick={handleCopyLink}
            className={`share-btn copy ${copySuccess ? 'success' : ''}`}
          >
            {copySuccess ? <Check size={iconSize} /> : <Link size={iconSize} />}
            <div className="share-content">
              <span className="platform">
                {copySuccess ? 'Copied!' : 'Copy Link'}
              </span>
              <span className="description">
                {copySuccess ? 'Link copied to clipboard' : 'Copy link to clipboard'}
              </span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`social-share default ${size} ${className}`}>
      <button
        onClick={handleNativeShare}
        className="share-trigger"
        title="Share this post"
      >
        <Share size={iconSize} />
        {showLabels && <span>Share</span>}
      </button>

      {showMenu && (
        <div className="share-dropdown">
          <div className="share-header">
            <h4>Share this post</h4>
          </div>
          
          <div className="share-options">
            <button
              onClick={() => {
                openShareWindow(shareLinks.twitter);
                setShowMenu(false);
              }}
              className="share-option twitter"
            >
              <Twitter size={16} />
              <span>Twitter</span>
            </button>

            <button
              onClick={() => {
                openShareWindow(shareLinks.facebook);
                setShowMenu(false);
              }}
              className="share-option facebook"
            >
              <Facebook size={16} />
              <span>Facebook</span>
            </button>

            <button
              onClick={() => {
                openShareWindow(shareLinks.linkedin);
                setShowMenu(false);
              }}
              className="share-option linkedin"
            >
              <Linkedin size={16} />
              <span>LinkedIn</span>
            </button>

            <button
              onClick={() => {
                openShareWindow(shareLinks.whatsapp);
                setShowMenu(false);
              }}
              className="share-option whatsapp"
            >
              <MessageCircle size={16} />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={() => {
                window.location.href = shareLinks.email;
                setShowMenu(false);
              }}
              className="share-option email"
            >
              <Mail size={16} />
              <span>Email</span>
            </button>

            <div className="share-divider" />

            <button
              onClick={() => {
                handleCopyLink();
                setShowMenu(false);
              }}
              className={`share-option copy ${copySuccess ? 'success' : ''}`}
            >
              {copySuccess ? <Check size={16} /> : <Copy size={16} />}
              <span>{copySuccess ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      )}

      {showMenu && (
        <div 
          className="share-backdrop"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

// Simple share button that opens native share or falls back to copy
interface QuickShareProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const QuickShare: React.FC<QuickShareProps> = ({
  url,
  title,
  description = '',
  className = '',
  size = 'md'
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copy
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  const iconSize = {
    sm: 14,
    md: 16,
    lg: 20
  }[size];

  return (
    <button
      onClick={handleShare}
      className={`quick-share ${size} ${copied ? 'copied' : ''} ${className}`}
      title={navigator.share ? 'Share' : 'Copy link'}
    >
      {copied ? <Check size={iconSize} /> : <Share size={iconSize} />}
    </button>
  );
};

// Share modal component for detailed sharing options
interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  description?: string;
  hashtags?: string[];
  authorName?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  url,
  title,
  description = '',
  hashtags = [],
  authorName
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isOpen) return null;

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const shareText = authorName ? `Check out "${title}" by ${authorName}` : title;

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodedUrl}${hashtags.length ? `&hashtags=${hashtags.join(',')}` : ''}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(shareText)}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0D%0A%0D%0A${encodedUrl}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const openShareWindow = (shareUrl: string) => {
    window.open(
      shareUrl,
      'share',
      'width=600,height=400,scrollbars=yes,resizable=yes'
    );
  };

  return (
    <div className="share-modal-overlay">
      <div className="share-modal">
        <div className="modal-header">
          <h3>Share this post</h3>
          <button onClick={onClose} className="close-btn">
            ×
          </button>
        </div>

        <div className="modal-content">
          <div className="post-preview">
            <h4>{title}</h4>
            {description && <p>{description}</p>}
            <div className="share-url">{url}</div>
          </div>

          <div className="share-platforms">
            <div className="platform-grid">
              <button
                onClick={() => openShareWindow(shareLinks.twitter)}
                className="platform-btn twitter"
              >
                <Twitter size={20} />
                <span>Twitter</span>
              </button>

              <button
                onClick={() => openShareWindow(shareLinks.facebook)}
                className="platform-btn facebook"
              >
                <Facebook size={20} />
                <span>Facebook</span>
              </button>

              <button
                onClick={() => openShareWindow(shareLinks.linkedin)}
                className="platform-btn linkedin"
              >
                <Linkedin size={20} />
                <span>LinkedIn</span>
              </button>

              <button
                onClick={() => openShareWindow(shareLinks.reddit)}
                className="platform-btn reddit"
              >
                <ExternalLink size={20} />
                <span>Reddit</span>
              </button>

              <button
                onClick={() => openShareWindow(shareLinks.telegram)}
                className="platform-btn telegram"
              >
                <MessageCircle size={20} />
                <span>Telegram</span>
              </button>

              <button
                onClick={() => window.location.href = shareLinks.email}
                className="platform-btn email"
              >
                <Mail size={20} />
                <span>Email</span>
              </button>
            </div>
          </div>

          <div className="copy-section">
            <div className="copy-input-group">
              <input
                type="text"
                value={url}
                readOnly
                className="copy-input"
              />
              <button
                onClick={handleCopyLink}
                className={`copy-btn ${copySuccess ? 'success' : ''}`}
              >
                {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                {copySuccess ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Social share counter component
interface ShareCounterProps {
  url: string;
  className?: string;
}

export const ShareCounter: React.FC<ShareCounterProps> = ({ url, className = '' }) => {
  const [shareCount, setShareCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock API call to get share count
    // In a real app, you'd call a service that aggregates shares across platforms
    const fetchShareCount = async () => {
      try {
        // Simulated share count
        const count = Math.floor(Math.random() * 1000);
        setShareCount(count);
      } catch (error) {
        console.error('Failed to fetch share count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShareCount();
  }, [url]);

  if (loading) {
    return (
      <div className={`share-counter loading ${className}`}>
        <span>•••</span>
      </div>
    );
  }

  if (shareCount === 0) {
    return null;
  }

  return (
    <div className={`share-counter ${className}`}>
      <Share size={14} />
      <span>{shareCount} shares</span>
    </div>
  );
};