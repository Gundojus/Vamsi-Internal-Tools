import React, { useState, useRef, useEffect } from "react";
import theme from "theme";
import {
  Theme,
  Text,
  Input,
  Hr,
  Box,
  Button,
  Section,
  Icon,
  Select,
} from "@quarkly/widgets";
import { Helmet } from "react-helmet";
import { GlobalQuarklyPageStyles } from "global-page-styles";
import { MdDeleteSweep, MdNoteAdd, MdArrowBack } from "react-icons/md";
import {
  uploadImage,
  uploadAudio,
  saveOrderToDatabase,
  addCustomerToDatabase
} from "../utils/firebaseConfig";
import { useHistory } from "react-router-dom";
import { getDatabase, ref as dbRef, onValue } from "firebase/database";

// UUID generation
const generateUUID = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 7; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export default function AddOrder() {
  const [customerName, setCustomerName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [images, setImages] = useState([]);
  const [pieces, setPieces] = useState([]);
  const [audioLink, setAudioLink] = useState("");
  const [deadlineDate, setDeadlineDate] = useState(new Date());
  const [customers, setCustomers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const history = useHistory();

  // Fetch existing customers
  useEffect(() => {
    const db = getDatabase();
    const custRef = dbRef(db, "vamsi/customers");
    onValue(custRef, (snapshot) => {
      const data = snapshot.val() || {};
      const arr = Object.keys(data).map((key) => ({
        uuid: key,
        name: data[key].name,
        phone: data[key].phone || data[key].phone_number,
        countryCode : data[key].countryCode
      }));
      setCustomers(arr);
    });
  }, []);

  // Filter as user types
  useEffect(() => {
    if (customerName.trim()) {
      const term = customerName.toLowerCase();
      const matches = customers.filter((c) =>
        c.name.toLowerCase().includes(term)
      );
      setFiltered(matches);
      console.log(matches);
      setShowDropdown(matches.length > 0);
    } else {
      setShowDropdown(false);
    }
  }, [customerName, customers]);

  // Handlers for selection
  const handleSelect = (cust) => {
    console.log(cust);
    setCustomerName(cust.name);
    setPhoneNumber(cust.phone);
    setCountryCode(cust.countryCode);
    setShowDropdown(false);
  };

  // Custom File Uploader Component
  const FileUploader = ({ handleFile }) => {
    const hiddenFileInput = useRef(null);

    const handleClick = () => {
      hiddenFileInput.current.click();
    };

    const handleChange = (event) => {
      const files = Array.from(event.target.files);
      handleFile(files);
    };

    return (
      <>
        <Button
          className="button-upload"
          onClick={handleClick}
          margin="20px 0"
          background="#cb7731"
          color="white"
          padding="10px 20px"
          border-radius="7.5px"
        >
          Upload Images
        </Button>
        <input
          type="file"
          onChange={handleChange}
          ref={hiddenFileInput}
          style={{ display: "none" }}
          multiple
          accept="image/*"
        />
      </>
    );
  };

  // Audio Recorder Component
  const AudioRecorder = ({
    handleAudioUpload,
    handleDeleteAudio,
    audioLink,
  }) => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunks = useRef([]);

    const handleStartRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks.current, {
            type: "audio/wav",
          });
          const audioLink = await handleAudioUpload(audioBlob);
          audioChunks.current = [];
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        alert("Error accessing microphone");
      }
    };

    const handleStopRecording = () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    };

    return (
      <>
        <Button
          margin="20px 0"
          background="#cb7731"
          color="white"
          padding="10px 20px"
          border-radius="7.5px"
          onClick={isRecording ? handleStopRecording : handleStartRecording}
        >
          {isRecording ? "Stop Recording" : "Record Audio"}
        </Button>
        {audioLink && (
          <Box display="flex" align-items="center">
            <audio controls>
              <source src={audioLink} type="audio/wav" />
              Your browser does not support the audio element.
            </audio>
            <Icon
              category="md"
              icon={MdDeleteSweep}
              size="24px"
              color="#ff0000"
              margin="0 0 0 10px"
              onClick={handleDeleteAudio}
              style={{ cursor: "pointer" }}
              aria-label="Delete Audio"
            />
          </Box>
        )}
      </>
    );
  };

  // Handle file upload and store image paths
  const handleFileUpload = async (files) => {
    try {
      const uploadedImageUrls = await Promise.all(
        files.map((file) => uploadImage(file)) // Use uploadImage function
      );
      setImages((prevImages) => [...prevImages, ...uploadedImageUrls]); // Store URLs
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Failed to upload images. Please try again.");
    }
  };

  // Handle audio upload and return the uploaded audio URL
  const handleAudioUpload = async (audioBlob) => {
    try {
      const audioURL = await uploadAudio(audioBlob);
      setAudioLink(audioURL);
      return audioURL;
    } catch (error) {
      console.error("Error uploading audio:", error);
      alert("Failed to upload audio. Please try again.");
      return "";
    }
  };

  // Handle deleting an image
  const handleDeleteImage = (index) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
  };

  // Handle deleting audio
  const handleDeleteAudio = () => {
    setAudioLink("");
  };

  // Add a new piece row
  const addPieceRow = () => {
    setPieces([
      ...pieces,
      { type: "Digital Printing", quantity: 1, remarks: "" },
    ]);
  };

  // Remove a piece row
  const removePieceRow = (index) => {
    setPieces(pieces.filter((_, i) => i !== index));
  };

  // Handle piece data updates
  const handleTypeChange = (index, value) => {
    const updatedPieces = pieces.map((piece, i) =>
      i === index ? { ...piece, type: value } : piece
    );
    setPieces(updatedPieces);
  };

  const handleQuantityChange = (index, value) => {
    const updatedPieces = pieces.map((piece, i) =>
      i === index ? { ...piece, quantity: Number(value) } : piece
    );
    setPieces(updatedPieces);
  };

  const handleRemarksChange = (index, value) => {
    const updatedPieces = pieces.map((piece, i) =>
      i === index ? { ...piece, remarks: value } : piece
    );
    setPieces(updatedPieces);
  };

  const totalPieces = pieces.reduce((acc, piece) => acc + piece.quantity, 0);

  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = `0${date.getMonth() + 1}`.slice(-2); // Months are zero-based
    const day = `0${date.getDate()}`.slice(-2);
    return `${year}-${month}-${day}`;
  };

  // Submit the order
  const handleSubmitOrder = async () => {
    // validation omitted
    const now = new Date();
    const orderUUID = generateUUID();
    const orderData = {
      customer_name: customerName,
      phone_number: `${countryCode}${phoneNumber}`,
      images,
      pieces: {
        number_of_pieces: pieces.reduce((a, p) => a + p.quantity, 0),
        details: pieces,
      },
      audio_link: audioLink,
      orderCreationTime: now.toLocaleTimeString("en-US", { hour12: true }),
      orderCreationDate: now.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      progress: "Pre-press",
      uuid: orderUUID,
      deadline_raw: deadlineDate.toISOString().split("T")[0],
      deadline_formatted: deadlineDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    };
    await saveOrderToDatabase(orderData, orderUUID);

    // inside handleSubmitOrder, before saving the order:
    const existing = customers.find((c) =>  c.name === customerName && c.phone === phoneNumber && c.countryCode === countryCode);
    if (!existing) {
      // generate an ID and push a new customer node
      const newCustId = generateUUID();
      await addCustomerToDatabase(
        newCustId,
        customerName,
        countryCode,
        phoneNumber,
        []
      );
    }


    history.push("/orders");
  };

  return (
    <Theme theme={theme}>
      <GlobalQuarklyPageStyles pageUrl={"orders-customers"} />
      <Helmet>
        <title>Add Order</title>
        <link
          rel={"shortcut icon"}
          href={"https://live.staticflickr.com/65535/54572815698_9a48e198df_b.jpg"}
          type={"image/x-icon"}
        />
      </Helmet>
      <Section padding="90px 0 100px 0">
        <Box position="relative" text-align="center">
          <Icon
            icon={MdArrowBack}
            onClick={() => history.push("/orders")}
            style={{ position: "absolute", left: 0, cursor: "pointer" }}
          />
          <Text font="56px">New Order</Text>
        </Box>

        {/* Customer Input with Autocomplete */}
        <Text>Customer Name</Text>
        <Box position="relative" width="50%">
          <Input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            onFocus={() => setShowDropdown(filtered.length > 0)}
          />
          {showDropdown && (
            <Box
              position="absolute"
              top="100%"
              width="100%"
              background="white"
              border="1px solid #ccc"
              z-index={10}
              max-height="150px"
              overflow="auto"
            >
              {filtered.map((c) => (
                <Box
                  key={c.uuid}
                  padding="8px"
                  hover-background="#f0f0f0"
                  onClick={() => handleSelect(c)}
                  style={{ cursor: "pointer" }}
                >
                  {c.name}
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Phone Input */}
        <Text>Phone Number</Text>
        <Box display="flex">
          <Input
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            width="10%"
          />
          <Input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            width="40%"
          />
        </Box>

        {/* Image Upload Section */}
        <Text margin="15px 0px 15px 0px">Upload Images</Text>
        <FileUploader handleFile={handleFileUpload} />
        {images.length === 0 ? null : (
          <Box
            display="grid"
            grid-template-columns={`repeat(${Math.min(
              images.length,
              4
            )}, 225px)`}
            grid-auto-rows="225px"
            grid-gap="15px"
            width={`${
              Math.min(images.length, 4) * 225 +
              (Math.min(images.length, 4) - 1) * 15
            }px`}
            overflow="auto"
            padding="15px"
            border="1px solid #ccc"
            margin="15px 0"
          >
            {images.map((image, index) => (
              <Box
                key={index}
                as="div"
                position="relative" // To position the delete icon
              >
                {/* Image Thumbnail */}
                <Box
                  as="img"
                  src={
                    image instanceof File ? URL.createObjectURL(image) : image
                  }
                  width="225px"
                  height="225px"
                  object-fit="cover"
                  border-radius="5px"
                />
                {/* Delete Icon */}
                <Icon
                  category="md"
                  icon={MdDeleteSweep}
                  size="24px"
                  color="#ff0000"
                  position="absolute"
                  top="5px"
                  right="5px"
                  onClick={() => handleDeleteImage(index)}
                  style={{
                    cursor: "pointer",
                    backgroundColor: "rgba(255,255,255,0.7)",
                    borderRadius: "50%",
                  }}
                  aria-label={`Delete image ${index + 1}`}
                />
              </Box>
            ))}
          </Box>
        )}

        <Hr
          min-height="10px"
          min-width="100%"
          margin="15px 0px 15px 0px"
          border-color="--color-darkL2"
          width="1200px"
        />

        {/* Audio Recording Section */}
        <Text margin="15px 0px 15px 0px">Record Audio</Text>
        <AudioRecorder
          handleAudioUpload={handleAudioUpload}
          handleDeleteAudio={handleDeleteAudio}
          audioLink={audioLink}
        />

        {/* Pieces Section */}
        <Box
          display="flex"
          align-items="center"
          justify-content="space-between"
        >
          <Text margin="15px 0px 15px 0px">Add Items</Text>
          <Icon
            category="md"
            icon={MdNoteAdd}
            size="32px"
            margin="16px 0px 16px 0px"
            onClick={addPieceRow}
            style={{ cursor: "pointer" }}
            aria-label="Add Piece"
          />
        </Box>

        {pieces.length > 0 && (
          <>
            {pieces.map((piece, index) => (
              <Box
                key={index}
                display="flex"
                align-items="center"
                margin="10px 0"
              >
                <Text width="5%" textAlign="center">
                  {index + 1}
                </Text>
                <Select
                  value={piece.type}
                  onChange={(e) => handleTypeChange(index, e.target.value)}
                  background="white"
                  width="20%"
                  padding="5px"
                  fontSize="16px"
                  margin="0 10px"
                >
                  <option value="Digital Printing">Digital Printing</option>
                  <option value="Offset Printing">Offset Printing</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Others">Others</option>
                </Select>
                <Input
                  type="number"
                  value={piece.quantity}
                  onChange={(e) => handleQuantityChange(index, e.target.value)}
                  width="20%"
                  min="1"
                  background="white"
                  padding="5px"
                  margin="0 10px"
                />
                <Input
                  type="text"
                  placeholder="Remarks"
                  value={piece.remarks}
                  onChange={(e) => handleRemarksChange(index, e.target.value)}
                  width="40%"
                  background="white"
                  padding="5px"
                  margin="0 10px"
                />
                <Icon
                  category="md"
                  icon={MdDeleteSweep}
                  size="24px"
                  color="#ff0000"
                  onClick={() => removePieceRow(index)}
                  style={{ cursor: "pointer" }}
                  aria-label={`Delete piece ${index + 1}`}
                />
              </Box>
            ))}
            <Text margin="15px 0px 15px 0px">
              Total Number of Items: {totalPieces}
            </Text>
          </>
        )}

        <Hr
          min-height="10px"
          min-width="100%"
          margin="15px 0px 15px 0px"
          border-color="--color-darkL2"
          width="1200px"
        />

        {/* Deadline Section */}
        <Text margin="15px 0px 15px 0px">Deadline</Text>
        <Input
          type="date"
          value={deadlineDate.toISOString().split("T")[0]}
          onChange={(e) => {
            setDeadlineDate(new Date(e.target.value));
          }}
          width="40%"
          background="white"
          padding="5px"
          margin="0 10px"
          required
        />
        <Hr
          min-height="10px"
          min-width="100%"
          margin="15px 0px 15px 0px"
          border-color="--color-darkL2"
          width="1200px"
        />
        {/* Submit Button */}
        <Button
          onClick={handleSubmitOrder}
          margin="40px 0"
          background="#cb7731"
          color="white"
          padding="10px 20px"
          border-radius="7.5px"
        >
          Submit Order
        </Button>
      </Section>
      {/* <Footer /> */}
    </Theme>
  );
}
