import {
  BAST_RULES,
  formatBastDate,
  formatBastDay,
  type BastDocument as BastDocumentData,
} from "@/lib/bast"

function LabelRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span>{label}</span>
      <span>: {value}</span>
    </>
  )
}

export function BastDocument({ doc }: { doc: BastDocumentData }) {
  const items = doc.items.length > 0 ? doc.items : [null]

  return (
    <div className="bast-print-area">
      <div className="bast-sheet mx-auto w-full max-w-[210mm] bg-white p-[16mm] text-[11pt] leading-relaxed text-black shadow-sm ring-1 ring-foreground/10">
        <h1 className="text-center text-[14pt] font-bold tracking-wide underline">
          BERITA ACARA SERAH TERIMA
        </h1>

        <p className="mt-6">
          Pada hari ini {formatBastDay(doc.date)} telah dilakukan serah terima
          aset/inventaris.
        </p>

        <div className="mt-4 grid grid-cols-[11rem_1fr] gap-x-1">
          <LabelRow label="Kepada" value={doc.receiverName || "—"} />
          <LabelRow
            label="Departemen/Base"
            value={doc.receiverDepartment || "—"}
          />
          <LabelRow label="Berupa" value="" />
        </div>

        <table className="mt-2 w-full border-collapse text-[10.5pt]">
          <thead>
            <tr>
              <th className="w-[8%] border border-black px-2 py-1 text-left font-bold">
                No
              </th>
              <th className="border border-black px-2 py-1 text-left font-bold">
                Item
              </th>
              <th className="w-[28%] border border-black px-2 py-1 text-left font-bold">
                Serial Number
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item ? item.id : `empty-${index}`}>
                <td className="border border-black px-2 py-1 align-top">
                  {item ? index + 1 : ""}
                </td>
                <td className="border border-black px-2 py-1 align-top">
                  {item?.name ?? ""}
                </td>
                <td className="border border-black px-2 py-1 align-top">
                  {item?.serialNumber ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-4">Kelengkapan lainnya :</p>
        {doc.accessories.length > 0 ? (
          <ol className="mt-1 list-decimal space-y-0.5 pl-6">
            {doc.accessories.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        ) : (
          <p className="mt-1">&nbsp;</p>
        )}

        <p className="mt-4">Aturan:</p>
        <ol className="mt-1 list-decimal space-y-1 pl-6">
          {BAST_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>

        <p className="mt-4">
          Demikian berita acara ini dibuat dengan sebenar-benarnya dan
          dipergunakan untuk kepentingan perusahaan.
        </p>

        <p className="mt-8 text-right">
          {doc.place}, {formatBastDate(doc.date)}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-8 text-center">
          <div>
            <p>Yang Menerima,</p>
            <p className="mt-16">( {doc.receiverName || "…"} )</p>
          </div>
          <div>
            <p>Diserahkan Oleh,</p>
            <p className="mt-16">( {doc.giverName || "…"} )</p>
          </div>
        </div>
      </div>
    </div>
  )
}
