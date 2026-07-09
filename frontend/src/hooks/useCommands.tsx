import { useCallback } from "react";
import toast from "react-hot-toast";
import { mqttService } from "../services/mqtt";
import { useAppStore } from "../stores/useAppStore";
import { MQTT_TOPICS } from "../constants";

export function useCommands() {
  const addCommand = useAppStore((s) => s.addCommand);

  const send = useCallback(
    (command: string, label: string, requiresConfirm = false) => {
      const doSend = () => {
        const ok = mqttService.publishControl(command);
        addCommand(command, ok);
        if (ok) {
          toast.success(`${label} sent`);
        } else {
          toast.error(`Failed to send ${label}`);
        }
      };

      if (requiresConfirm) {
        toast(
          (t) => (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Confirm {label}?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { toast.dismiss(t.id); doSend(); }}
                  className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg"
                >
                  Confirm
                </button>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="px-3 py-1 bg-gray-600 text-white text-xs rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          ),
          { duration: 8000 }
        );
      } else {
        doSend();
      }
    },
    [addCommand]
  );

  const sendConfig = useCallback(
    (config: Record<string, unknown>) => {
      const ok = mqttService.publishConfig(config);
      if (ok) toast.success("Configuration published");
      else toast.error("Failed to publish config");
    },
    []
  );

  return { send, sendConfig };
}
