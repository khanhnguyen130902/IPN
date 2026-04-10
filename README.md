"# IPN"

## Giải thích các trường trong log

Các field dưới đây xuất hiện trong log hiển thị UI (`/logs`) và/hoặc log gửi Telegram.

- **`STT` (Sequence)**: số thứ tự log, tăng dần 1, 2, 3… theo thời gian server ghi nhận log mới.

- **`duplicateInfo`**: trạng thái trùng lặp theo nội dung payload (dựa trên hash fingerprint).
  - `first_time`: lần đầu thấy payload này
  - `duplicate_x2`, `duplicate_x3`, ...: payload giống nhau xuất hiện lần thứ 2, 3, ...

- **`status`**
  - `success`: giải mã IPN thành công (đúng key + parse JSON OK)
  - `error`: lỗi xử lý (thiếu `data`, decrypt fail, sai key…)
  - `telegram_error`: gửi Telegram thất bại sau khi retry (log nội bộ hệ thống)

- **`merchant`**: tên merchant tương ứng với AES key đã decrypt đúng trong `AES_KEY_LIST`.

- **`attempts`**: số lần thử decrypt qua danh sách key (ví dụ `1` nghĩa là đúng ngay key đầu).

- **`error`**: mô tả lỗi khi `status = "error"` (nếu không lỗi thì `null`).

- **`validation`**: kết quả validate payload theo rule đã định nghĩa (CARD/QR).
  - **`applied`**: `true` nếu rule validate có áp dụng (thường khi `paymentType` là `CARD` hoặc `QR`)
  - **`profile`**: loại rule đã áp dụng (ví dụ `master-merchant-card`, `merchant-card`, `master-merchant-qr`, `merchant-qr`)
  - **`valid`**: `true/false` payload có hợp lệ theo rule hay không
  - **`missingFields`**: danh sách field bắt buộc bị thiếu
  - **`errors`**: danh sách lỗi về dữ liệu/logic (ví dụ field rỗng, field không khớp rule…)
