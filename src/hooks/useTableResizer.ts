import { useEffect, useRef } from 'react';

/**
 * Universal Hook to make table columns resizable by dragging the boundary between header columns (th).
 * Can be attached to a specific table ref, or automatically attaches to all .table elements in the component.
 */
export function useTableResizer<T extends HTMLElement = HTMLTableElement>(customRef?: React.RefObject<T | null>) {
  const localRef = useRef<T>(null);
  const targetRef = customRef || localRef;

  useEffect(() => {
    const root = targetRef.current;
    const tables: HTMLTableElement[] = [];
    if (root) {
      if (root.tagName === 'TABLE') {
        tables.push(root as unknown as HTMLTableElement);
      } else {
        tables.push(...Array.from(root.querySelectorAll<HTMLTableElement>('table.table')));
      }
    } else {
      tables.push(...Array.from(document.querySelectorAll<HTMLTableElement>('table.table')));
    }

    const cleanups: Array<() => void> = [];

    tables.forEach(table => {
      const thead = table.querySelector('thead');
      if (!thead) return;

      const ths = Array.from(thead.querySelectorAll<HTMLTableCellElement>('th'));

      ths.forEach((th, index) => {
        // Skip the very last column or columns explicitly marked as non-resizable
        if (index === ths.length - 1 || th.classList.contains('no-resize')) return;

        th.style.position = 'relative';

        // Check if resizer already exists
        let resizer = th.querySelector<HTMLDivElement>('.table-col-resizer');
        if (!resizer) {
          resizer = document.createElement('div');
          resizer.className = 'table-col-resizer';
          resizer.title = 'Arrastra para ajustar el ancho de la columna';
          th.appendChild(resizer);
        }

        let startX = 0;
        let startWidth = 0;

        const handleMouseDown = (e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();

          startX = e.pageX;
          startWidth = th.getBoundingClientRect().width;

          resizer?.classList.add('is-resizing');
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';

          const handleMouseMove = (moveEvent: MouseEvent) => {
            const diff = moveEvent.pageX - startX;
            const newWidth = Math.max(45, Math.round(startWidth + diff));
            th.style.width = `${newWidth}px`;
            th.style.minWidth = `${newWidth}px`;
          };

          const handleMouseUp = () => {
            resizer?.classList.remove('is-resizing');
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        };

        resizer.addEventListener('mousedown', handleMouseDown);
        cleanups.push(() => {
          resizer?.removeEventListener('mousedown', handleMouseDown);
        });
      });
    });

    return () => {
      cleanups.forEach(fn => fn());
    };
  });

  return targetRef;
}

/**
 * Global component/hook to automatically initialize column resizing on all tables in the view
 */
export function useAutoTableResizer() {
  useEffect(() => {
    const initResizers = () => {
      const tables = Array.from(document.querySelectorAll<HTMLTableElement>('table.table'));

      tables.forEach(table => {
        const thead = table.querySelector('thead');
        if (!thead) return;

        const ths = Array.from(thead.querySelectorAll<HTMLTableCellElement>('th'));

        ths.forEach((th, index) => {
          if (index === ths.length - 1 || th.classList.contains('no-resize')) return;

          th.style.position = 'relative';

          if (!th.querySelector('.table-col-resizer')) {
            const resizer = document.createElement('div');
            resizer.className = 'table-col-resizer';
            resizer.title = 'Arrastra para ajustar el ancho de la columna';

            resizer.addEventListener('mousedown', (e: MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();

              const startX = e.pageX;
              const startWidth = th.getBoundingClientRect().width;

              resizer.classList.add('is-resizing');
              document.body.style.cursor = 'col-resize';
              document.body.style.userSelect = 'none';

              const onMouseMove = (moveEvent: MouseEvent) => {
                const diff = moveEvent.pageX - startX;
                const newWidth = Math.max(45, Math.round(startWidth + diff));
                th.style.width = `${newWidth}px`;
                th.style.minWidth = `${newWidth}px`;
              };

              const onMouseUp = () => {
                resizer.classList.remove('is-resizing');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
              };

              document.addEventListener('mousemove', onMouseMove);
              document.addEventListener('mouseup', onMouseUp);
            });

            th.appendChild(resizer);
          }
        });
      });
    };

    initResizers();
    const observer = new MutationObserver(() => initResizers());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, []);
}
