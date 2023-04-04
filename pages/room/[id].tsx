import Layout from "@/components/layout";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { socket } from "@/context/socketUrl";
import { useRouter } from "next/router";
import { CopyToClipboard } from "react-copy-to-clipboard";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

const FaceTime = dynamic(() => import("@/components/FaceTime"), { ssr: false });
const FileUpload = dynamic(() => import("@/components/FileUpload"));

export default function Room() {
  const router = useRouter();

  const fullPath =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://app-ruscello.vercel.app";

  const { id: roomName } = router.query;
  const [youtube, youtubeActive] = useState(true);

  useEffect(() => {
    socket.emit("join", { room: roomName, socketId: socket.io.engine.id });
  }, [roomName]);

  function toggleActive() {
    youtubeActive((prev) => !prev);
  }

  return (
    <Layout>
      <div className="m-2 top-0 left-0">
        <CopyToClipboard text={fullPath + router.asPath}>
          <ContentCopyIcon fontSize="large" />
        </CopyToClipboard>
      </div>

      <div className="relative w-full h-full">
        <div className="absolute top-0 left-0 w-full h-full">
          <FileUpload />
        </div>

        <FaceTime />
      </div>
    </Layout>
  );
}
