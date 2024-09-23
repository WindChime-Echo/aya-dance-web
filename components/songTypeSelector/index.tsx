"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Accordion,
  AccordionItem,
  Listbox,
  ListboxItem,
  ScrollShadow,
  Skeleton,
} from "@nextui-org/react"

import styles from "./index.module.css"
import { GenericVideoGroup } from "@/types/video"

interface SongTypeSelectorProps {
  songTypes: GenericVideoGroup[]
  loading: boolean
  onSelectionChange: (selectedKey: string) => void
}

export default function SongTypeSelector({
  songTypes,
  loading,
  onSelectionChange,
}: SongTypeSelectorProps) {
  function groupBy<K, V>(array: V[], grouper: (item: V) => K) {
    return array.reduce((store: Map<K, V[]>, item) => {
      var key = grouper(item)
      if (!store.has(key)) {
        store.set(key, [item])
      } else {
        store.get(key)!!.push(item)
      }
      return store
    }, new Map<K, V[]>())
  }

  const songTypeOptions = useMemo(() => {
    const option = songTypes.map((group: GenericVideoGroup) => {
      return {
        key: group.title,
        label: group.title,
        major: group.major,
      }
    })

    const groups: {
      major: string
      items: { key: string; label: string }[]
    }[] = []
    groupBy(option, (item) => item.major).forEach((value, key) => {
      groups.push({
        major: key === "" ? "À la carte" : key,
        items: value,
      })
    })
    return groups
  }, [songTypes])

  const [selectedKeys, setSelectedKeys] = useState(new Set(["All Songs"]))

  useEffect(() => {
    if (selectedKeys.size === 1) {
      const selectedKey = Array.from(selectedKeys)[0]

      onSelectionChange(selectedKey)
    }
  }, [selectedKeys, onSelectionChange])

  return (
    <>
      {loading ? (
        <div className="flex flex-wrap h-full">
          <div
            className="flex flex-col justify-between h-full "
            style={{ width: "10vw" }}
          >
            {Array.from({ length: 21 }).map((_, index) => (
              <Skeleton
                key={index}
                className="rounded-lg"
                style={{ padding: "12px" }}
              >
                <div className="h-full w-full rounded-lg bg-default-200" />
              </Skeleton>
            ))}
          </div>
        </div>
      ) : (
        <ScrollShadow hideScrollBar className="w-[220px] h-[798px]">
          <Accordion
            selectionMode={"multiple"}
            isCompact={true}
            defaultExpandedKeys={songTypeOptions.map((x) => x.major)}
            className={styles.accordion}
            itemClasses={{
              base: `${styles.accordionItem}`,
              title: `${styles.accordionTitle} font-bold text-sm`,
            }}
          >
            {songTypeOptions.map((group) => (
              <AccordionItem
                key={group.major}
                title={group.major}
                aria-label={group.major}
              >
                <Listbox
                  aria-label="songType"
                  classNames={{
                    base: `${styles.listbox}`,
                  }}
                  items={group.items}
                  selectedKeys={selectedKeys}
                  selectionMode="single"
                  onSelectionChange={(keys) => {
                    if (keys instanceof Set && keys.size > 0) {
                      setSelectedKeys(keys as Set<string>)
                    }
                  }}
                >
                  {(item) => (
                    <ListboxItem
                      key={item.key}
                      hideSelectedIcon
                      className={`${styles.customListboxItem}`}
                    >
                      {item.label}
                    </ListboxItem>
                  )}
                </Listbox>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollShadow>
      )}
    </>
  )
}
