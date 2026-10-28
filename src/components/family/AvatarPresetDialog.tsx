import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import React, { type FC, useCallback, useEffect, useState } from 'react';

import globalize from 'lib/globalize';
import {
    AVATAR_COLORS,
    AVATAR_GLYPHS,
    type AvatarColor,
    type AvatarGlyph,
    type AvatarPreset,
    getAvatarColor,
    getAvatarGlyph,
    getDefaultAvatarPreset
} from 'utils/avatarPreset';

import { useFullScreenDialog } from './useFullScreenDialog';

interface AvatarPresetDialogProps {
    open: boolean
    memberName?: string | null
    /** The profile already has an image, which adds the option to remove it. */
    hasImage: boolean
    isSaving?: boolean
    errorMessage?: string
    onClose: () => void
    onSave: (preset: AvatarPreset) => void
    onRemove: () => void
}

/** The ring every selected option and every focused option wears. */
const FOCUS_RING = '0 0 0 3px var(--siren-focus-ring, var(--jf-palette-primary-main))';

const PREVIEW_SIZE = 112;
const SWATCH_SIZE = 40;
const GLYPH_BUTTON_SIZE = 56;

interface GlyphIconProps {
    glyph: AvatarGlyph
    size: number
}

/** The glyph drawn the way the canvas draws it: the icon's path on its 24-unit box. */
const GlyphIcon: FC<GlyphIconProps> = ({ glyph, size }) => (
    <SvgIcon viewBox='0 0 24 24' sx={{ width: size, height: size, color: '#ffffff' }} aria-hidden>
        <path d={glyph.path} />
    </SvgIcon>
);

interface ColorSwatchProps {
    color: AvatarColor
    selected: boolean
    onSelect: (id: string) => void
}

const ColorSwatch: FC<ColorSwatchProps> = ({ color, selected, onSelect }) => {
    const onClick = useCallback(() => onSelect(color.id), [ color.id, onSelect ]);

    return (
        <ButtonBase
            focusRipple
            onClick={onClick}
            aria-label={globalize.translate(color.labelKey)}
            aria-pressed={selected}
            sx={{
                width: SWATCH_SIZE,
                height: SWATCH_SIZE,
                borderRadius: '50%',
                bgcolor: color.hex,
                border: '2px solid',
                borderColor: 'background.paper',
                boxShadow: selected ? FOCUS_RING : 'none',
                '&:focus-visible': { boxShadow: FOCUS_RING }
            }}
        />
    );
};

interface GlyphButtonProps {
    glyph: AvatarGlyph
    colorHex: string
    selected: boolean
    onSelect: (id: string) => void
}

const GlyphButton: FC<GlyphButtonProps> = ({ glyph, colorHex, selected, onSelect }) => {
    const onClick = useCallback(() => onSelect(glyph.id), [ glyph.id, onSelect ]);

    return (
        <ButtonBase
            focusRipple
            onClick={onClick}
            aria-label={globalize.translate(glyph.labelKey)}
            aria-pressed={selected}
            sx={{
                width: GLYPH_BUTTON_SIZE,
                height: GLYPH_BUTTON_SIZE,
                borderRadius: '28%',
                bgcolor: selected ? colorHex : 'action.selected',
                boxShadow: selected ? FOCUS_RING : 'none',
                transition: 'background-color 150ms ease',
                '&:focus-visible': { boxShadow: FOCUS_RING }
            }}
        >
            <GlyphIcon glyph={glyph} size={GLYPH_BUTTON_SIZE * 0.55} />
        </ButtonBase>
    );
};

/**
 * Picks a preset avatar for a profile: one of eight background colours and one of twelve glyphs,
 * previewed live. Saving renders the pair to a PNG and uploads it as the profile image.
 */
const AvatarPresetDialog: FC<AvatarPresetDialogProps> = ({
    open,
    memberName,
    hasImage,
    isSaving = false,
    errorMessage,
    onClose,
    onSave,
    onRemove
}) => {
    const [ preset, setPreset ] = useState<AvatarPreset>(() => getDefaultAvatarPreset(memberName));
    const fullScreen = useFullScreenDialog();

    useEffect(() => {
        if (open) setPreset(getDefaultAvatarPreset(memberName));
    }, [ open, memberName ]);

    const onColorSelect = useCallback((color: string) => {
        setPreset(current => ({ ...current, color }));
    }, []);

    const onGlyphSelect = useCallback((glyph: string) => {
        setPreset(current => ({ ...current, glyph }));
    }, []);

    const onSaveClick = useCallback(() => {
        onSave(preset);
    }, [ onSave, preset ]);

    const color = getAvatarColor(preset.color) ?? AVATAR_COLORS[0];
    const glyph = getAvatarGlyph(preset.glyph) ?? AVATAR_GLYPHS[0];

    return (
        <Dialog open={open} onClose={onClose} fullWidth fullScreen={fullScreen} maxWidth='xs'>
            <DialogTitle>
                {globalize.translate('ChooseAvatar')}
                {memberName ? ` · ${memberName}` : ''}
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2.5} sx={{ pt: 1 }}>
                    {errorMessage && (
                        <Alert severity='error'>{errorMessage}</Alert>
                    )}

                    <Box
                        role='img'
                        aria-label={globalize.translate('AvatarPreview')}
                        sx={{
                            alignSelf: 'center',
                            width: PREVIEW_SIZE,
                            height: PREVIEW_SIZE,
                            borderRadius: '28%',
                            bgcolor: color.hex,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 3,
                            transition: 'background-color 150ms ease'
                        }}
                    >
                        <GlyphIcon glyph={glyph} size={PREVIEW_SIZE * 0.58} />
                    </Box>

                    <Box>
                        <Typography variant='subtitle2' component='h3' sx={{ mb: 1 }}>
                            {globalize.translate('AvatarBackground')}
                        </Typography>
                        <Stack direction='row' flexWrap='wrap' useFlexGap spacing={1.25}>
                            {AVATAR_COLORS.map(option => (
                                <ColorSwatch
                                    key={option.id}
                                    color={option}
                                    selected={option.id === color.id}
                                    onSelect={onColorSelect}
                                />
                            ))}
                        </Stack>
                    </Box>

                    <Box>
                        <Typography variant='subtitle2' component='h3' sx={{ mb: 1 }}>
                            {globalize.translate('AvatarIcon')}
                        </Typography>
                        <Stack direction='row' flexWrap='wrap' useFlexGap spacing={1.25}>
                            {AVATAR_GLYPHS.map(option => (
                                <GlyphButton
                                    key={option.id}
                                    glyph={option}
                                    colorHex={color.hex}
                                    selected={option.id === glyph.id}
                                    onSelect={onGlyphSelect}
                                />
                            ))}
                        </Stack>
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color='inherit' disabled={isSaving}>
                    {globalize.translate('ButtonCancel')}
                </Button>
                {hasImage && (
                    <Button onClick={onRemove} color='error' disabled={isSaving}>
                        {globalize.translate('RemoveAvatar')}
                    </Button>
                )}
                <Button onClick={onSaveClick} variant='contained' disabled={isSaving}>
                    {globalize.translate('Save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AvatarPresetDialog;
