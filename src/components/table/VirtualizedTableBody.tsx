// // filepath: /home/hoangdanh2000/Desktop/Projects/react-table-power/src/components/table/VirtualizedTableBody.tsx

// import React, { useRef, useEffect } from 'react';
// import { useVirtual } from 'react-virtual';
// import { TableBodyProps, Row, Cell } from '@tanstack/react-table';
// import { BaseTableData } from '../../types';

// export interface VirtualizedTableBodyProps<T extends BaseTableData = BaseTableData>
//   extends TableBodyProps {
//   /**
//    * Row data for the table
//    */
//   rows: Row<T>[];

//   /**
//    * Total number of rows
//    */
//   totalRows: number;

//   /**
//    * Height of each row in pixels
//    */
//   rowHeight?: number;

//   /**
//    * Height of the container in pixels
//    */
//   containerHeight?: number | string;

//   /**
//    * Whether to enable row virtualization
//    * @default true
//    */
//   virtualization?: boolean;

//   /**
//    * Whether to enable row hover effect
//    * @default true
//    */
//   hover?: boolean;

//   /**
//    * Whether to use striped rows
//    * @default false
//    */
//   striped?: boolean;

//   /**
//    * Whether rows have borders
//    * @default true
//    */
//   bordered?: boolean;

//   /**
//    * Custom renderer for row (allowing to customize row appearance)
//    */
//   rowRenderer?: (row: Row<T>, index: number, virtualRow: any) => React.ReactNode;

//   /**
//    * Custom renderer for cell (allowing to customize cell appearance)
//    */
//   cellRenderer?: (cell: Cell<T, unknown>, rowIndex: number) => React.ReactNode;

//   /**
//    * Callback triggered when hovering over a row
//    */
//   onRowMouseEnter?: (row: Row<T>, e: React.MouseEvent) => void;

//   /**
//    * Callback triggered when mouse leaves a row
//    */
//   onRowMouseLeave?: (row: Row<T>, e: React.MouseEvent) => void;

//   /**
//    * Callback triggered when clicking a row
//    */
//   onRowClick?: (row: Row<T>, e: React.MouseEvent) => void;

//   /**
//    * Class name for the table body
//    */
//   className?: string;
// }

// /**
//  * VirtualizedTableBody component for efficiently rendering large tables with virtualization
//  */
// export function VirtualizedTableBody<T extends BaseTableData = BaseTableData>({
//   rows,
//   totalRows,
//   rowHeight = 48,
//   containerHeight = 400,
//   virtualization = true,
//   hover = true,
//   striped = false,
//   bordered = true,
//   rowRenderer,
//   cellRenderer,
//   onRowMouseEnter,
//   onRowMouseLeave,
//   onRowClick,
//   className,
//   ...tableBodyProps
// }: VirtualizedTableBodyProps<T>) {
//   const parentRef = useRef<HTMLDivElement>(null);

//   const rowVirtualizer = useVirtual({
//     size: virtualization ? totalRows : rows.length,
//     parentRef,
//     estimateSize: React.useCallback(() => rowHeight, [rowHeight]),
//     overscan: 10,
//   });

//   useEffect(() => {
//     // Reset virtualization when rows change significantly
//     rowVirtualizer.measure();
//   }, [rows.length, rowVirtualizer]);

//   if (!virtualization) {
//     return (
//       <tbody
//         {...tableBodyProps}
//         className={`rpt-tbody ${className || ''} ${hover ? 'rpt-tbody-hover' : ''} ${
//           striped ? 'rpt-tbody-striped' : ''
//         } ${bordered ? 'rpt-tbody-bordered' : ''}`}
//       >
//         {rows.map((row, index) => {
//           row.getVisibleCells();
//           return rowRenderer ? (
//             rowRenderer(row, index, null)
//           ) : (
//             <tr
//               key={row.id}
//               className={`rpt-tr ${row.getIsSelected() ? 'rpt-tr-selected' : ''}`}
//               onMouseEnter={onRowMouseEnter ? (e) => onRowMouseEnter(row, e) : undefined}
//               onMouseLeave={onRowMouseLeave ? (e) => onRowMouseLeave(row, e) : undefined}
//               onClick={onRowClick ? (e) => onRowClick(row, e) : undefined}
//               data-state={row.getIsSelected() ? 'selected' : ''}
//             >
//               {row.getVisibleCells().map((cell) =>
//                 cellRenderer ? (
//                   cellRenderer(cell, index)
//                 ) : (
//                   <td key={cell.id} className="rpt-td">
//                     {cell.getValue() as React.ReactNode}
//                   </td>
//                 )
//               )}
//             </tr>
//           );
//         })}
//       </tbody>
//     );
//   }

//   return (
//     <div
//       ref={parentRef}
//       className="rpt-virtualized-container"
//       style={{
//         height: containerHeight,
//         overflow: 'auto',
//         position: 'relative',
//       }}
//     >
//       <div
//         style={{
//           height: `${rowVirtualizer.totalSize}px`,
//           width: '100%',
//           position: 'relative',
//         }}
//       >
//         <table
//           className="rpt-virtualized-table"
//           style={{ tableLayout: 'fixed', width: '100%' }}
//         >
//           <tbody
//             {...tableBodyProps}
//             className={`rpt-tbody ${className || ''} ${hover ? 'rpt-tbody-hover' : ''} ${
//               striped ? 'rpt-tbody-striped' : ''
//             } ${bordered ? 'rpt-tbody-bordered' : ''}`}
//           >
//             {rowVirtualizer.virtualItems.map((virtualRow) => {
//               const row = rows[virtualRow.index];
//               if (!row) return null;

//               return rowRenderer ? (
//                 rowRenderer(row, virtualRow.index, virtualRow)
//               ) : (
//                 <tr
//                   key={row.id}
//                   className={`rpt-tr ${row.getIsSelected() ? 'rpt-tr-selected' : ''}`}
//                   onMouseEnter={onRowMouseEnter ? (e) => onRowMouseEnter(row, e) : undefined}
//                   onMouseLeave={onRowMouseLeave ? (e) => onRowMouseLeave(row, e) : undefined}
//                   onClick={onRowClick ? (e) => onRowClick(row, e) : undefined}
//                   data-state={row.getIsSelected() ? 'selected' : ''}
//                   style={{
//                     position: 'absolute',
//                     top: 0,
//                     left: 0,
//                     width: '100%',
//                     height: `${rowHeight}px`,
//                     transform: `translateY(${virtualRow.start}px)`,
//                   }}
//                 >
//                   {row.getVisibleCells().map((cell) =>
//                     cellRenderer ? (
//                       cellRenderer(cell, virtualRow.index)
//                     ) : (
//                       <td key={cell.id} className="rpt-td">
//                         {cell.getValue() as React.ReactNode}
//                       </td>
//                     )
//                   )}
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// export default VirtualizedTableBody;