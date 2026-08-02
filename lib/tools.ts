export type ToolStatus = "live" | "beta" | "planned";

export interface Tool {
  slug: string;
  badge: string;
  title: string;
  short: string;
  description: string;
  status: ToolStatus;
  chips: string[];
  detail: string[];
  /** CSS var suffix — resolves to var(--tool-{color}), also used as icon key */
  color: "pid" | "blackbox" | "build" | "rates" | "flight" | "presets";
}

export const tools: Tool[] = [
  {
    color: "pid",
    slug: "pid",
    badge: "PID",
    title: "PID Advisor",
    short: "Tuning direction from your flying style",
    description:
      "แนะนำทิศทางการจูนจากสไตล์การบิน เพื่อให้เริ่ม tuning ได้เร็วและแม่นขึ้น",
    status: "live",
    chips: ["Baseline ตาม frame + prop", "6 สไตล์การบิน", "บันทึกเป็นพรีเซ็ตได้ทันที"],
    detail: [
      "ป้อนสเปกเฟรม มอเตอร์ prop และสไตล์การบิน แล้วรับ baseline P/I/D/D_min ที่ควรเริ่มจูนจากตรงนั้น ค่าที่กรอกจำไว้อัตโนมัติในเครื่องนี้",
      "อธิบายเหตุผลของแต่ละค่าแบบอ่านง่าย พร้อมสูตรที่ตรวจสอบได้ ไม่ใช่ตัวเลขลอย ๆ",
      "เชื่อมกับ Blackbox Analyzer จริงแล้ว (ส่งคำแนะนำปรับ D/P มาต่อยอดได้ทันที) และบันทึกผลลัพธ์เป็นพรีเซ็ตส่วนตัวได้จากหน้านี้เลย",
    ],
  },
  {
    color: "blackbox",
    slug: "blackbox",
    badge: "BBX",
    title: "Blackbox Analyzer",
    short: "Read oscillation and noise from real logs",
    description: "ช่วยอ่านอาการสั่น แกว่ง และ noise จากข้อมูลจริงให้เข้าใจง่าย",
    status: "beta",
    chips: ["อัปโหลด CSV ที่ decode แล้ว", "Noise spectrum (FFT) จริงต่อแกน", "Motor saturation + battery sag"],
    detail: [
      "อัปโหลดไฟล์ CSV ที่ decode แล้วจาก Blackbox Explorer หรือ blackbox_decode วิเคราะห์ในเบราว์เซอร์ทันที ไม่อัปโหลดขึ้น server",
      "คำนวณ RMS tracking error, noise spectrum จาก FFT จริงต่อแกน (roll/pitch/yaw), motor saturation และแรงดันแบตจากข้อมูลจริงในไฟล์",
      "ยังไม่รองรับไฟล์ .bbl ดิบและยังไม่มี step response analysis — เชื่อมกับ PID Advisor เป็นเฟสถัดไป",
    ],
  },
  {
    color: "build",
    slug: "build",
    badge: "BLD",
    title: "Build Helper",
    short: "Match frame, motor, battery, and feel",
    description: "วางภาพรวมการประกอบโดรนให้เข้ากับเฟรม มอเตอร์ แบต และฟีลบิน",
    status: "beta",
    chips: ["Power-to-weight จากไฟฟ้าจริง", "เตือน ESC/มอเตอร์ไม่เข้ากัน", "จัดกลุ่มตามสไตล์การบิน"],
    detail: [
      "กรอก AUW เซลล์แบต และ current rating ของ ESC/มอเตอร์ แล้วดู power-to-weight (W/g) ที่คำนวณจากไฟฟ้าจริง",
      "เตือนคู่อุปกรณ์ที่ไม่เข้ากัน เช่น ESC amp rating ต่ำกว่าที่มอเตอร์ต้องการ",
      "จัดกลุ่มผลลัพธ์ตามเกณฑ์ community: freestyle / all-round / long range",
    ],
  },
  {
    color: "rates",
    slug: "rates",
    badge: "RTE",
    title: "Rates Visualizer",
    short: "Feel your stick response before the field",
    description: "ทดลองฟีลคันเร่งและสติ๊กก่อนลงสนามจริง เพื่อหา setup ที่ถนัดที่สุด",
    status: "beta",
    chips: ["กราฟ response แบบ real-time", "เทียบ rates หลายชุดพร้อมกัน", "สูตร Actual Rates ของ Betaflight จริง"],
    detail: [
      "ปรับ RC rate, super rate และ expo แล้วเห็นกราฟ stick-to-rotation ทันที",
      "เทียบ curve เดิมกับ curve ใหม่แบบซ้อนกันบนกราฟเดียว",
      "บันทึกเป็น preset ส่วนตัวเพื่อใช้ซ้ำหรือแชร์ต่อ",
    ],
  },
  {
    color: "flight",
    slug: "flight",
    badge: "CHK",
    title: "Flight Readiness",
    short: "Pre-flight checklist that reduces mistakes",
    description: "เช็กลิสต์ก่อนบินที่ช่วยลดความผิดพลาดและเพิ่มความปลอดภัย",
    status: "live",
    chips: ["แบต / prop / screws", "VTX / RX / arming", "จำสถานะไว้ในเครื่อง"],
    detail: [
      "เช็กลิสต์แบบ tap-to-confirm ก่อนบินทุกครั้ง แบ่งเป็นหมวด power / airframe / RF / arming",
      "จำสถานะล่าสุดไว้ในเครื่องนี้ (localStorage) กด \"เริ่มเช็คลิสต์ใหม่\" เมื่อเริ่มเที่ยวบินใหม่",
      "เตือนชัดเจนถ้ายังมีข้อความปลอดภัย (critical) ที่ยังไม่ได้เช็ค",
    ],
  },
  {
    color: "presets",
    slug: "presets",
    badge: "PRE",
    title: "Smart Presets",
    short: "Starting points for every flying style",
    description: "พรีเซ็ตพื้นฐานสำหรับ freestyle, cinematic และ long range พร้อมต่อยอดได้",
    status: "beta",
    chips: ["คำนวณจากเครื่องมือเดียวกับ PID Advisor", "Export เป็น Betaflight CLI", "บันทึกพรีเซ็ตของตัวเองในเครื่อง"],
    detail: [
      "คลังพรีเซ็ตเริ่มต้นสำหรับ freestyle, cinematic, long range และ micro คำนวณจาก engine เดียวกับ PID Advisor / Rates Visualizer",
      "Export ตรงเป็นคำสั่ง Betaflight CLI พร้อมวางใช้ได้ทันที",
      "บันทึกพรีเซ็ตของตัวเองไว้ในเครื่องนี้ (localStorage) — cloud sync ข้ามอุปกรณ์เป็นแผนในเฟสถัดไป",
    ],
  },
];

export const statusLabel: Record<ToolStatus, string> = {
  live: "Live",
  beta: "Beta",
  planned: "In development",
};
