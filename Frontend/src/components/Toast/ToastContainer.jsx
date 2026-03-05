import { useToast } from "../../context/ToastContext";
import Toast from "./Toast";

export default function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} />
      ))}
    </div>
  );
}