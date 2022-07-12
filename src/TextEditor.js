import React from "react";
import { useState, useCallback, useEffect } from "react";
import Quill from "quill";
import { useParams } from "react-router-dom";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";

// custom font size
const fontSizeArr = [
  "8px",
  "9px",
  "10px",
  "12px",
  "14px",
  "16px",
  "20px",
  "24px",
  "32px",
  "42px",
  "54px",
  "68px",
  "84px",
  "98px",
];

var Size = Quill.import("attributors/style/size");
Size.whitelist = fontSizeArr;
Quill.register(Size, true);

var toolbarOptions = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],

  [{ size: fontSizeArr }],

  [{ font: [] }],

  ["bold", "italic", "underline", "strike"], // toggled buttons

  ["blockquote", "code-block"],

  [{ header: 1 }, { header: 2 }], // custom button values
  [{ list: "ordered" }, { list: "bullet" }],
  [{ direction: "rtl" }], // text direction
  [{ color: [] }, { background: [] }], // dropdown with defaults from theme
  [{ align: [] }],
  ["clean"], // remove formatting button
];

export default function TextEditor() {
  // this ensures we can connect  our socket from anywhere
  const [socket, setSocket] = useState();
  const [quill, setquill] = useState();

  const { id: documentId } = useParams();
  // console.log(documentId); id is stored in documentId

  useEffect(() => {
    // call the io with the url of server
    // io("http://localhost:3001");
    // this returns a socket so store it

    // basically this is the connection to the server as we have already done the vice versa
    const s = io("http://localhost:3001");
    setSocket(s);

    // finally disconnect when done
    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket == null || quill == null) return;

    // then server returns back us the document
    socket.once("load-document", (document) => {
      quill.setContents(document); //load
      quill.enable(); // after loading only enable quill
    });

    // send the id using get-document event to server so that it creates a room and checks if already present or not
    socket.emit("get-document", documentId);
  }, [socket, quill, documentId]);

  // this useEffect is used to detect changes whenever quill changes
  // check quill documentation on text change event
  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta); // delta -> the part which was changed , send it to server
    };
    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler); // handler is then function we want to remove
    };
  }, [socket, quill]);

  // handles received changes from server to client
  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta) => {
      quill.updateContents(delta); //update the changes
    };

    socket.on("received-changes", handler);

    return () => {
      socket.off("received-changes", handler); // handler is then function we want to remove
    };

    // socket.once("load-document", (document) => {
    //   quill.setContents(document);
    //   quill.enable();
    // });

    // socket.emit("get-document", documentId);
  }, [socket, quill]);

  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return; // if no conent is there then return

    wrapper.innerHTML = ""; // clear the content
    const editor = document.createElement("div");
    wrapper.append(editor);

    // refer quill documentation
    const q = new Quill(editor, {
      modules: {
        toolbar: toolbarOptions,
      },
      theme: "snow", // Specify theme in configuration
    });

    q.disable();
    q.setText("Loading bro.. Please wait");
    setquill(q);
  }, []);

  return <div className="container" ref={wrapperRef}></div>;
}
