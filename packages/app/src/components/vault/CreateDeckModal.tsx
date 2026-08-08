import React, { useState } from 'react';
import { X, Sparkles, FileText, Check } from 'lucide-react';
import { createCustomDeckFromText } from '../../db/queries';
import { extractSentencesAndChars } from '../../core/normalization';
import { useNavigate } from 'react-router-dom';

interface CreateDeckModalProps {
  onClose: () => void;
}

export const CreateDeckModal: React.FC<CreateDeckModalProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rawText, setRawText] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const preview = extractSentencesAndChars(rawText);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !rawText.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const deckId = await createCustomDeckFromText(
        title.trim(),
        description.trim(),
        rawText.trim()
      );
      onClose();
      navigate(`/decks/${deckId}`);
    } catch (err) {
      console.error('Failed to create custom deck:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 500,
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 20,
          border: '1px solid var(--border-color)',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Create Custom Deck
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: 6,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Deck Title */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
              Deck Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. News Article, HSK 5 Story, Song Lyrics..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 12,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Chapter 1 reading notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 12,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Raw Text Area */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
              Paste Chinese Text *
            </label>
            <textarea
              required
              rows={5}
              placeholder="Paste any Chinese text here... 我们一起学习中文！今天天气很好。"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 12,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: 14,
                lineHeight: 1.5,
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'none',
              }}
            />
          </div>

          {/* Text Analysis Live Preview */}
          {rawText.trim() && (
            <div
              style={{
                background: 'rgba(0, 229, 255, 0.06)',
                border: '1px solid rgba(0, 229, 255, 0.2)',
                borderRadius: 12,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent-cyan)', fontWeight: 600 }}>
                <FileText size={16} />
                <span>Text Analysis Preview</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {preview.characters.length} characters • {preview.sentences.length} sentences
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!title.trim() || !rawText.trim() || isCreating}
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 12,
              border: 'none',
              background: !title.trim() || !rawText.trim() ? 'rgba(255, 255, 255, 0.08)' : 'var(--accent-cyan)',
              color: !title.trim() || !rawText.trim() ? 'var(--text-muted)' : '#000',
              fontSize: 15,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: !title.trim() || !rawText.trim() || isCreating ? 'default' : 'pointer',
              marginTop: 6,
            }}
          >
            <Check size={18} />
            <span>{isCreating ? 'Normalizing Text...' : 'Create Custom Deck'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
