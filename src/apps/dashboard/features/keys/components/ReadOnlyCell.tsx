import LockIcon from '@mui/icons-material/Lock';
import Chip from '@mui/material/Chip';
import type { MRT_Cell, MRT_RowData } from 'material-react-table';
import React, { type FC } from 'react';

import globalize from 'lib/globalize';

interface CellProps {
    cell: MRT_Cell<MRT_RowData>
}

/** The "Read only" chip of a key that may only read; nothing for a key that may change things. */
const ReadOnlyCell: FC<CellProps> = ({ cell }) => (
    cell.getValue<boolean>() ? (
        <Chip
            size='small'
            color='warning'
            variant='outlined'
            icon={<LockIcon />}
            label={globalize.translate('LabelReadOnly')}
        />
    ) : null
);

export default ReadOnlyCell;
