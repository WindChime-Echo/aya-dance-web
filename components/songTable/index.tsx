"use client"

import { Key, useMemo, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Checkbox,
  Pagination,
  ScrollShadow,
} from "@nextui-org/react"

import TableItem from "./components/tableItem"
import styles from "./index.module.css"

import { selectSongInfo, setSortBy } from "@/store/modules/songInfo"
import { GenericVideo, SortBy } from "@/types/video"
import {
  selectPlayOptions,
  setLockedRandomGroup,
} from "@/store/modules/playOptions"
import { Check, Edit } from "@/assets/icon"

interface SongTableProps {
  genericVideos: GenericVideo[]
  loading: boolean
  targetKey: string
  isCustomPlaylist: boolean
  isEditMode: boolean
  handleItemDelete?: (id: GenericVideo) => void
  switchEditMode?: (isEdit: boolean) => void
}

export default function SongTable({
  genericVideos,
  loading,
  targetKey,
  isCustomPlaylist,
  isEditMode,
  handleItemDelete,
  switchEditMode,
}: SongTableProps) {
  const dispatch = useDispatch()
  const { sortBy: SortByValue } = useSelector(selectSongInfo)
  const { lockedRandomGroup } = useSelector(selectPlayOptions)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState("20") // 初始值为 20
  const pageOptions = [
    { value: "10", label: "10 首/页" },
    { value: "20", label: "20 首/页" },
    { value: "50", label: "50 首/页" },
    { value: "100", label: "100 首/页" },
  ]
  const numRowsPerPage = Number(rowsPerPage)
  const pages =
    Math.ceil(genericVideos.length / numRowsPerPage) === 0
      ? 1
      : Math.ceil(genericVideos.length / numRowsPerPage)

  const items = useMemo(() => {
    const start = (page - 1) * numRowsPerPage
    const end = start + numRowsPerPage

    return genericVideos.slice(start, end)
  }, [page, numRowsPerPage, genericVideos])

  useMemo(() => {
    setPage(1)
  }, [numRowsPerPage, genericVideos.length])

  // sort
  const sortOptions = [
    { value: `${SortBy.ID_ASC}`, label: "ID 升序" },
    { value: `${SortBy.ID_DESC}`, label: "ID 降序" },
    { value: `${SortBy.TITLE_ASC}`, label: "标题升序" },
    { value: `${SortBy.TITLE_DESC}`, label: "标题降序" },
  ]

  const handleLockRandom = (locked: boolean) => {
    dispatch(
      setLockedRandomGroup(
        locked ? { group: targetKey, isCustom: isCustomPlaylist } : null
      )
    )
  }

  const itemsView = () => {
    const videos = isEditMode ? genericVideos : items
    return videos.map((item, index) => (
      <TableItem
        key={index}
        song={item}
        isEdit={isEditMode}
        handleDelete={handleItemDelete}
      />
    ))
  }

  return (
    <div className={styles.table}>
      <div className="flex justify-between items-center">
        <div className="font-bold text-l text-primary mb-4 mt-4 leading-snug">{`${genericVideos.length} Videos in ${targetKey}`}</div>
        {switchEditMode && (
          <Button
            isIconOnly
            color="default"
            variant="light"
            aria-label="collection"
            onClick={() => switchEditMode(!isEditMode)}
          >
            {isEditMode ? (
              <Check className="w-6 h-6 text-black dark:text-white" />
            ) : (
              <Edit className="w-6 h-6 text-black dark:text-white" />
            )}
          </Button>
        )}
      </div>
      {isEditMode ? (
        <ScrollShadow hideScrollBar className="w-full h-[680px]">
          <div className="w-full h-[680px] sortable-list">{itemsView()}</div>
        </ScrollShadow>
      ) : (
        <ScrollShadow hideScrollBar className="w-full h-[680px]">
          {itemsView()}
        </ScrollShadow>
      )}
      <div className={styles.bottom}>
        <div>
          {!isEditMode && (
            <Autocomplete
              aria-label="change rows per page"
              className="w-[130px]"
              defaultItems={pageOptions}
              isClearable={false}
              selectedKey={rowsPerPage}
              onSelectionChange={setRowsPerPage as (key: Key | null) => void}
            >
              {pageOptions.map((option) => (
                <AutocompleteItem key={option.value} value={option.value}>
                  {option.label}
                </AutocompleteItem>
              ))}
            </Autocomplete>
          )}
          {!isCustomPlaylist && (
            <Autocomplete
              aria-label="change rows per slot"
              className="w-[130px] ml-4"
              defaultItems={sortOptions}
              isClearable={false}
              selectedKey={`${SortByValue}`}
              onSelectionChange={(key) => {
                if (key !== null) {
                  dispatch(setSortBy(Number(key) as SortBy))
                }
              }}
            >
              {sortOptions.map((option) => (
                <AutocompleteItem key={option.value} value={option.value}>
                  {option.label}
                </AutocompleteItem>
              ))}
            </Autocomplete>
          )}

          <Checkbox
            className="ml-2"
            isSelected={
              !!lockedRandomGroup &&
              targetKey === lockedRandomGroup.group &&
              isCustomPlaylist === lockedRandomGroup.isCustom
            }
            onValueChange={handleLockRandom}
          >
            锁定随机
          </Checkbox>
        </div>

        {!isEditMode && (
          <Pagination
            isCompact
            showControls
            showShadow
            color="primary"
            page={page}
            total={pages}
            onChange={(page) => setPage(page)}
          />
        )}
      </div>
    </div>
  )
}
