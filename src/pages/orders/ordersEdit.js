// Import necessary modules and components
import React, { useState, useEffect, useRef } from "react";
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
  fetchOrderById,
  editOrderById,
  uploadImage,
  uploadAudio,
  deleteImageFromStorage, // Import delete functions (to be implemented)
  deleteAudioFromStorage, // Import delete functions (to be implemented)
} from "../utils/firebaseConfig"; // Import Firebase functions
import { useHistory, useLocation } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";
import Footer from "../utils/footer";
// Helper function to extract the UUID from the URL query string
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

// UUID generation function
const generateUUID = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 7; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// WhatsApp message sending function
const sendWhatsAppMessage = (phoneNumber, orderUUID) => {
  const message = `Hi, your order with UUID: ${orderUUID} has been successfully placed.`;
  console.log(
    `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(
      message
    )}`
  );
  // Uncomment the lines below to enable WhatsApp message sending
  // const whatsappAPIUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(
  //   message
  // )}`;
  // window.open(whatsappAPIUrl, "_blank");
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

// Audio Recorder Component with Deletion Capability
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
        const audioURL = await handleAudioUpload(audioBlob);
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

export default () => {
  const history = useHistory();
  const query = useQuery();
  const uuid = query.get("uuid"); // Extract UUID from URL
  const [orderData, setOrderData] = useState(null); // To store fetched order data
  const [pieces, setPieces] = useState([]); // For pieces list
  const [progress, setProgress] = useState(""); // To track the progress status
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState(null); // Add error state
  const [imageUrls, setImageUrls] = useState([]); // For storing image URLs
  const [audioURL, setAudioURL] = useState(null); // For storing audio URLs
  const [modalOpen, setModalOpen] = useState(false); // For modal state
  const [modalImageUrl, setModalImageUrl] = useState(""); // For the image in modal
  const [deadline, setDeadline] = useState(""); // For storing the deadline date

  // Helper function to format dates
  const convertToInputDateFormat = (dateString) => {
    // Parse the date string, e.g., "November 8, 2024"
    const parsedDate = new Date(dateString);

    // Format as YYYY-MM-DD for input date compatibility
    const year = parsedDate.getFullYear();
    const month = `0${parsedDate.getMonth() + 1}`.slice(-2); // Months are zero-based
    const day = `0${parsedDate.getDate()}`.slice(-2);

    return `${year}-${month}-${day}`;
  };

  // Fetch order details on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (uuid) {
          fetchOrderById(uuid, (data) => {
            if (data) {
              setOrderData(data);
              setPieces(data?.pieces?.details || []);
              setProgress(data?.progress || "Pre-press");
              setImageUrls(data.images || []);
              setAudioURL(data.audio_link || null);
              setDeadline(convertToInputDateFormat(data.deadline_raw) || ""); // Set deadline if available
            } else {
              setError("Order not found or invalid UUID.");
            }
            setLoading(false);
          });
        } else {
          setError("Invalid order UUID.");
          setLoading(false);
        }
      } catch (err) {
        setError("Error fetching order data.");
        setLoading(false);
      }
    };
    fetchData();
  }, [uuid]);

  // Handle file upload for additional images
  const handleFileUpload = async (files) => {
    try {
      const uploadedImageUrls = await Promise.all(
        files.map((file) => uploadImage(file)) // Use uploadImage function
      );
      setImageUrls((prevUrls) => [...prevUrls, ...uploadedImageUrls]);
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload images. Please try again.");
    }
  };

  // Handle audio upload
  const handleAudioUpload = async (audioBlob) => {
    try {
      const audioLink = await uploadAudio(audioBlob);
      setAudioURL(audioLink);
      return audioLink;
    } catch (error) {
      console.error("Error uploading audio:", error);
      alert("Failed to upload audio. Please try again.");
      return "";
    }
  };

  // Handle deleting an image
  const handleDeleteImage = async (index) => {
    if (
      window.confirm(
        "Are you sure you want to delete this image? This action cannot be undone."
      )
    ) {
      try {
        const imageToDelete = imageUrls[index];
        // If imageToDelete is a URL, extract the storage path if possible
        // This depends on how your image URLs are structured
        // Example: Assuming image URLs contain the storage path after a specific base URL
        const storagePath = extractStoragePathFromURL(imageToDelete); // Implement this function based on your URL structure
        if (storagePath) {
          await deleteImageFromStorage(storagePath); // Implement deleteImageFromStorage in firebaseConfig.js
        }
        const updatedImages = imageUrls.filter((_, i) => i !== index);
        setImageUrls(updatedImages);
      } catch (error) {
        console.error("Error deleting image:", error);
        alert("Failed to delete image. Please try again.");
      }
    }
  };

  // Helper function to extract storage path from URL (Implementation depends on your storage setup)
  const extractStoragePathFromURL = (url) => {
    // Example implementation:
    // Assuming your Firebase storage URLs are structured as:
    // https://firebasestorage.googleapis.com/v0/b/your-app.appspot.com/o/path%2Fto%2Fimage.jpg?...
    // You need to extract 'path/to/image.jpg'
    try {
      const baseURL = "https://firebasestorage.googleapis.com/v0/b/your-app.appspot.com/o/";
      if (url.startsWith(baseURL)) {
        const encodedPath = url.substring(baseURL.length, url.indexOf("?"));
        return decodeURIComponent(encodedPath);
      }
      return null;
    } catch (error) {
      console.error("Error extracting storage path:", error);
      return null;
    }
  };

  // Handle deleting audio
  const handleDeleteAudio = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete the audio recording? This action cannot be undone."
      )
    ) {
      try {
        if (audioURL) {
          // Extract storage path from audio URL
          const storagePath = extractStoragePathFromURL(audioURL); // Implement this function based on your URL structure
          if (storagePath) {
            await deleteAudioFromStorage(storagePath); // Implement deleteAudioFromStorage in firebaseConfig.js
          }
          setAudioURL(null);
        }
      } catch (error) {
        console.error("Error deleting audio:", error);
        alert("Failed to delete audio. Please try again.");
      }
    }
  };

  // Audio Recorder Component with Deletion Capability
  const AudioRecorderWithDeletion = ({
    handleAudioUpload,
    handleDeleteAudio,
    audioLink,
  }) => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunks = useRef([]);

    const handleStartRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
          const audioURL = await handleAudioUpload(audioBlob);
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

  // Function to format phone number for WhatsApp API
  const formatPhoneNumber = (phone) => {
    // Remove any non-digit characters
    return phone.replace(/\D/g, "");
  };

  // Handle WhatsApp click
  const handleWhatsAppClick = () => {
    const message = `Your order has been confirmed.\nVisit https://internal.gundojus.in/#/orders/view?uuid=${uuid} to check the progress.\n\n- Sujatha Reddy`;
    const phoneNumber = formatPhoneNumber(orderData.phone_number);
    const url = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(
      message
    )}`;
    // window.open(url, "_blank");
  };

  // Handle updating order data in Firebase
  const handleSaveOrder = async () => {
    try {
      const convertToReadableDate = (inputDate) => {
        // Parse the input date string
        const date = new Date(inputDate);

        // Array of month names
        const monthNames = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];

        // Get day, month, and year
        const day = date.getDate();
        const month = monthNames[date.getMonth()]; // Get the month name
        const year = date.getFullYear();

        return `${month} ${day}, ${year}`;
      };

      const updatedOrderData = {
        ...orderData,
        pieces: {
          ...orderData.pieces,
          details: pieces,
          number_of_pieces: totalPieces,
        },
        progress,
        images: imageUrls, // Include updated images array
        audio_link: audioURL, // Include audio URL
        deadline_raw: deadline, // Include deadline in YYYY-MM-DD format
        deadline_formatted: convertToReadableDate(deadline), // Include deadline formatted
      };
      await editOrderById(uuid, updatedOrderData);
      alert("Order updated successfully");
      history.push("/orders");
    } catch (err) {
      console.error("Error updating order:", err);
      alert("Error updating order. Please try again.");
    }
  };

  // Open image in modal
  const openImageInModal = (url) => {
    setModalImageUrl(url);
    setModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setModalOpen(false);
    setModalImageUrl("");
  };

  // Handle adding a new piece row
  const addPieceRow = () => {
    setPieces([...pieces, { type: "Digital Printing", quantity: 1, remarks: "" }]);
  };

  // Handle removing a piece row
  const removePieceRow = (index) => {
    setPieces(pieces.filter((_, i) => i !== index));
  };

  // Handle piece type change
  const handleTypeChange = (index, value) => {
    const updatedPieces = pieces.map((piece, i) =>
      i === index ? { ...piece, type: value } : piece
    );
    setPieces(updatedPieces);
  };

  // Handle piece quantity change
  const handleQuantityChange = (index, value) => {
    const updatedPieces = pieces.map((piece, i) =>
      i === index ? { ...piece, quantity: Number(value) } : piece
    );
    setPieces(updatedPieces);
  };

  // Handle piece remarks change
  const handleRemarksChange = (index, value) => {
    const updatedPieces = pieces.map((piece, i) =>
      i === index ? { ...piece, remarks: value } : piece
    );
    setPieces(updatedPieces);
  };

  // Calculate total pieces
  const totalPieces = pieces.reduce((acc, piece) => acc + piece.quantity, 0);

  if (loading) {
    return (
      <Theme theme={theme}>
        <GlobalQuarklyPageStyles pageUrl={"orders-edit"} />
        <Helmet>
          <title>Edit Order</title>
          <link
            rel={"shortcut icon"}
            href={"https://live.staticflickr.com/65535/54572815698_9a48e198df_b.jpg"}
            type={"image/x-icon"}
          />
        </Helmet>
        <Section padding="90px 0 100px 0" quarkly-title="Schedule-5">
          <Text>Loading...</Text>
        </Section>
      </Theme>
    );
  }

  if (error) {
    return (
      <Theme theme={theme}>
        <GlobalQuarklyPageStyles pageUrl={"orders-edit"} />
        <Helmet>
          <title>Edit Order</title>
          <link
            rel={"shortcut icon"}
            href={"https://live.staticflickr.com/65535/54572815698_9a48e198df_b.jpg"}
            type={"image/x-icon"}
          />
        </Helmet>
        <Section padding="90px 0 100px 0" quarkly-title="Schedule-5">
          <Text>{error}</Text>
        </Section>
      </Theme>
    );
  }

  return (
    <Theme theme={theme}>
      <GlobalQuarklyPageStyles pageUrl={"orders-edit"} />
      <Helmet>
        <title>Edit Order</title>
        <link
          rel={"shortcut icon"}
          href={"https://live.staticflickr.com/65535/54572815698_9a48e198df_b.jpg"}
          type={"image/x-icon"}
        />
      </Helmet>

      {/* Main Content */}
      <Section padding="90px 0 100px 0" quarkly-title="Schedule-5">
        {/* Begin Fixed-Width Container */}
        <Box
          min-width="1200px"
          overflow="auto"
          margin="0 auto"
          padding="0 10px" // Optional: Add horizontal padding
        >
          {/* Header Section */}
          <Box
            display="flex"
            align-items="center"
            justify-content="center"
            position="relative"
          >
            <Icon
              category="md"
              icon={MdArrowBack}
              size="40px"
              margin="16px"
              padding="0px 0px 16px 0px"
              onClick={() => history.push("/orders")}
              style={{ cursor: "pointer", position: "absolute", left: "0" }}
              aria-label="Back to Orders"
            />
            <Text
              margin="0px 0px 20px 0px"
              text-align="center"
              font="normal 500 56px/1.2 --fontFamily-serifGeorgia"
              color="--dark"
              sm-margin="0px 0px 30px 0px"
            >
              Edit Order
            </Text>
          </Box>

          <Box min-width="100px" min-height="100px" padding="15px 0px 15px 0px">
            {/* Customer Name */}
            <Box display="flex" align-items="center" margin="15px 0px 15px 0px">
              <Text margin="0">Customer Name</Text>
              {/* <FaWhatsapp
                size="24px"
                style={{ cursor: "pointer", marginLeft: "10px" }}
                onClick={handleWhatsAppClick}
                aria-label="Send WhatsApp Message"
              /> */}
            </Box>
            <Input
              display="block"
              background="white"
              border-color="--color-darkL2"
              border-radius="7.5px"
              width="50%"
              value={orderData.customer_name || ""}
              readOnly
            />
            <Hr margin="15px 0px 15px 0px" width="1200px" />

            {/* Phone Number */}
            <Text margin="15px 0px 15px 0px">Phone Number</Text>
            <Input
              display="block"
              background="white"
              border-color="--color-darkL2"
              border-radius="7.5px"
              width="50%"
              value={orderData.phone_number || ""}
              readOnly
            />
            <Hr margin="15px 0px 15px 0px" width="1200px" />

            {/* Progress */}
            <Text margin="15px 0px 15px 0px">Progress</Text>
            <Select
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              background="white"
              width="50%"
              padding="5px"
              border-radius="7.5px"
            >
              <option value="Pre-press">Pre-press</option>
                    <option value="Press">Press</option>
                    <option value="Post-press">Post-press</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Payment Pending">Payment Pending</option>
                    <option value="Payment Received">Payment Received</option>
            </Select>
            <Hr margin="15px 0px 15px 0px" width="1200px" />

            {/* Pieces Section */}
            <Box
              display="flex"
              align-items="center"
              justify-content="space-between"
            >
              <Text margin="15px 0px 15px 0px">Add Pieces</Text>
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
                      aria-label={`Delete Piece ${index + 1}`}
                    />
                  </Box>
                ))}
                <Text margin="15px 0px 15px 0px">
                  Total Number of Items : {totalPieces}
                </Text>
              </>
            )}
            <Hr margin="15px 0px 15px 0px" width="1200px" />

            {/* Images Section */}
            <Text margin="15px 0px 15px 0px">Images</Text>
            <FileUploader handleFile={handleFileUpload} />
            {imageUrls.length > 0 && (
              <Box
                display="grid"
                grid-template-columns={`repeat(${Math.min(
                  imageUrls.length,
                  4
                )}, 225px)`}
                grid-auto-rows="225px"
                grid-gap="15px"
                width={`${
                  Math.min(imageUrls.length, 4) * 225 +
                  (Math.min(imageUrls.length, 4) - 1) * 15
                }px`}
                overflow="auto"
                padding="15px"
                border="1px solid #ccc"
                margin="15px 0"
              >
                {imageUrls.map((url, index) => (
                  <Box
                    key={index}
                    as="div"
                    position="relative" // To position the delete icon
                  >
                    {/* Image Thumbnail */}
                    <Box
                      as="img"
                      src={url}
                      width="225px"
                      height="225px"
                      object-fit="cover"
                      border-radius="5px"
                      onClick={() => openImageInModal(url)}
                      style={{ cursor: "pointer" }}
                      alt={`Order Image ${index + 1}`}
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
                      aria-label={`Delete Image ${index + 1}`}
                    />
                  </Box>
                ))}
              </Box>
            )}
            <Hr margin="15px 0px 15px 0px" width="1200px" />

            {/* Audio Recording Section */}
            <Text margin="15px 0px 15px 0px">Audio</Text>
            <AudioRecorderWithDeletion
              handleAudioUpload={handleAudioUpload}
              handleDeleteAudio={handleDeleteAudio}
              audioLink={audioURL}
            />
            <Hr margin="15px 0px 15px 0px" width="1200px" />

            {/* Deadline Section */}
            <Text margin="15px 0px 15px 0px">Deadline</Text>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => {
                setDeadline(e.target.value);
              }}
              width="40%"
              background="white"
              padding="5px"
              margin="0 10px"
              required
            />
            <Hr margin="15px 0px 15px 0px" width="1200px" />

            {/* Save Button */}
            <Button
              onClick={handleSaveOrder}
              margin="40px 0"
              background="#cb7731"
              color="white"
              padding="10px 20px"
              border-radius="7.5px"
            >
              Save Changes
            </Button>
          </Box>
          {/* End Fixed-Width Container */}
        </Box>

        {/* Image Modal */}
        {modalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.8)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
            onClick={closeModal}
          >
            <img
              src={modalImageUrl}
              alt="Full Size"
              style={{ maxHeight: "90%", maxWidth: "90%" }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </Section>
      {/* <Footer /> */}
    </Theme>
  );
};
