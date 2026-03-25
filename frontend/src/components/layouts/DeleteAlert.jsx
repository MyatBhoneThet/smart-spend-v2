import React from 'react';
import useT from '../../hooks/useT';

const DeleteAlert = ({ content, onDelete}) => {
    const { t } = useT();

    const tt = (key, fallback) => {
    const val = t?.(key);
    return val && val !== key ? val : fallback;
  };

    return (
        <div>
            <p className ="text-sm">{content}</p>

            <div className ="flex justify-end mt-6">
                <button
                    type="button"
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    onClick = {onDelete}
                >
                    {tt('settings.delete','Delete')}
                </button>
            </div>
        </div>
    )
}

export default DeleteAlert;
