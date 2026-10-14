import { useState } from "react";
import { CascadingDateSelect } from "assui";

const Basic = () => {
  const [value, setValue] = useState<string>();

  return (
    <div style={{ maxWidth: 480 }}>
      <CascadingDateSelect
        value={value}
        onChange={setValue}
        maxDate="2008-09-30"
        placeholder={{ year: "年", month: "月", day: "日" }}
      />
      <p>{`当前值：${value ?? "未选择"}`}</p>
      <button type="button" onClick={() => setValue("2000-02-29")}>
        回填闰年日期
      </button>
      <button type="button" onClick={() => setValue(undefined)}>
        清空完整日期
      </button>
    </div>
  );
};

export default Basic;
