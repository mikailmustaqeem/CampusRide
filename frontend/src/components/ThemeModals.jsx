import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const font = "'Sora', system-ui, sans-serif";

const backdropStyle = {
    position: 'fixed',
    inset: 0,
    zIndex: 9998,
    background: 'rgba(10, 8, 18, 0.75)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
};

const panelStyle = {
    position: 'relative',
    zIndex: 9999,
    width: '100%',
    maxWidth: 400,
    background: 'linear-gradient(145deg, rgba(30, 24, 45, 0.98) 0%, rgba(17, 13, 30, 0.99) 100%)',
    border: '1px solid rgba(139, 92, 246, 0.25)',
    borderRadius: 20,
    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(167, 139, 250, 0.06) inset',
    padding: '28px 26px 24px',
    fontFamily: font,
};

const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 12px',
    borderRadius: 999,
    background: 'rgba(109, 40, 217, 0.2)',
    border: '1px solid rgba(139, 92, 246, 0.35)',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.14em',
    color: '#a78bfa',
    marginBottom: 14,
};

/**
 * Two-action confirmation (replaces window.confirm). Match CampusRide dark + violet theme.
 */
export function ConfirmModal({
    open,
    title = 'Confirm',
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    danger = false,
    onConfirm,
    onCancel,
}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === 'Escape') onCancel?.();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onCancel]);

    if (!open) return null;

    return createPortal(
        <div style={backdropStyle} onClick={(e) => e.target === e.currentTarget && onCancel?.()}>
            <div style={panelStyle} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
                <div style={badgeStyle}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a78bfa' }} />
                    CAMPUSRIDE
                </div>
                <h2 id="confirm-title" style={{ margin: '0 0 10px', fontSize: 19, fontWeight: 700, color: '#fff', letterSpacing: '-0.4px' }}>
                    {title}
                </h2>
                <p style={{ margin: '0 0 22px', fontSize: 14, lineHeight: 1.55, color: '#a1a1aa' }}>{message}</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{
                            padding: '10px 18px',
                            borderRadius: 12,
                            border: '1px solid rgba(255,255,255,0.12)',
                            background: 'rgba(255,255,255,0.06)',
                            color: '#d4d4d8',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: font,
                        }}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        style={{
                            padding: '10px 18px',
                            borderRadius: 12,
                            border: danger ? '1px solid rgba(248,113,113,0.45)' : '1px solid rgba(139,92,246,0.45)',
                            background: danger ? 'rgba(248,113,113,0.18)' : 'rgba(124,58,237,0.35)',
                            color: danger ? '#fca5a5' : '#e9d5ff',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: font,
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

/**
 * Single-action notice (replaces window.alert).
 * variant: success | error | info
 */
export function NoticeModal({
    open,
    title,
    message,
    variant = 'info',
    buttonText = 'OK',
    onClose,
}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    const accent =
        variant === 'success'
            ? { border: 'rgba(52,211,153,0.35)', glow: 'rgba(52,211,153,0.12)', title: '#6ee7b7' }
            : variant === 'error'
              ? { border: 'rgba(248,113,113,0.4)', glow: 'rgba(248,113,113,0.1)', title: '#fca5a5' }
              : { border: 'rgba(139,92,246,0.35)', glow: 'rgba(167,139,250,0.08)', title: '#c4b5fd' };

    const defaultTitle =
        variant === 'success' ? 'Success' : variant === 'error' ? 'Something went wrong' : 'Notice';

    return createPortal(
        <div style={backdropStyle} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
            <div
                style={{
                    ...panelStyle,
                    borderColor: accent.border,
                    boxShadow: `${panelStyle.boxShadow}, 0 0 40px ${accent.glow}`,
                }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div style={badgeStyle}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a78bfa' }} />
                    CAMPUSRIDE
                </div>
                <h2 style={{ margin: '0 0 10px', fontSize: 19, fontWeight: 700, color: accent.title, letterSpacing: '-0.4px' }}>
                    {title ?? defaultTitle}
                </h2>
                <p style={{ margin: '0 0 22px', fontSize: 14, lineHeight: 1.55, color: '#d4d4d8' }}>{message}</p>
                <button
                    type="button"
                    onClick={onClose}
                    style={{
                        width: '100%',
                        padding: '12px 18px',
                        borderRadius: 12,
                        border: '1px solid rgba(139,92,246,0.45)',
                        background: 'rgba(124,58,237,0.4)',
                        color: '#f5f3ff',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: font,
                    }}
                >
                    {buttonText}
                </button>
            </div>
        </div>,
        document.body
    );
}
