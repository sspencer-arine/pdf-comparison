import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { useEffect, useState } from "react";
import { highlightPlugin, Trigger } from "@react-pdf-viewer/highlight";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "./App.css";

interface Comparison {
  patient: string;
  report: string;
  old: string;
  new: string;
}

function ComparisonViewer() {
  const { dataset } = useParams();
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const defaultLayout1 = defaultLayoutPlugin();
  const defaultLayout2 = defaultLayoutPlugin();
  const highlightPluginLeft = highlightPlugin({ trigger: Trigger.None });
  const highlightPluginRight = highlightPlugin({ trigger: Trigger.None });

  useEffect(() => {
    if (!searchParams.has("page")) {
      setSearchParams({ page: "0" }, { replace: true });
    }
  });

  useEffect(() => {
    const loadComparisons = async () => {
      const response = await fetch(`/datasets/${dataset}.json`);
      const data = await response.json();
      setComparisons(data);
    };

    if (dataset) loadComparisons();

    const index = parseInt(searchParams.get("page") || "0", 10);
    setCurrentIndex(index);
  }, [dataset, searchParams]);

  const handleNavigation = (step: number) => {
    const newIndex = Math.max(
      0,
      Math.min(comparisons.length - 1, currentIndex + step)
    );
    setCurrentIndex(newIndex);
    setSearchParams({ page: newIndex.toString() });
    navigate(`/${dataset}?page=${newIndex}`, { replace: true }); // Maintain dataset in the path
  };

  const handleMouseOverWord = (word: string) => {
    console.log(word);
    setHoveredWord(word);
  };

  const handleMouseOutWord = () => {
    setHoveredWord(null);
  };

  const currentComparison = comparisons[currentIndex];

  if (!currentComparison) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen p-4">
      <div className="flex justify-between items-center mb-4">
        <button
          className={`px-4 py-2 rounded flex items-center ${
            currentIndex === 0
              ? "bg-gray-400 text-gray-200 cursor-not-allowed hover:line-through"
              : "bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
          }`}
          onClick={() => handleNavigation(-1)}
          disabled={currentIndex === 0}
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          <span className="mr-2">Previous</span>
        </button>
        <h1 className="text-xl font-semibold">
          {currentIndex + 1} of {comparisons.length}: Patient:
          {currentComparison.patient} Report:{currentComparison.report}
        </h1>
        <button
          className={`px-4 py-2 rounded flex items-center ${
            currentIndex === comparisons.length - 1
              ? "bg-gray-400 text-gray-200 cursor-not-allowed hover:line-through"
              : "bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
          }`}
          onClick={() => handleNavigation(1)}
          disabled={currentIndex === comparisons.length - 1}
        >
          <span className="mr-2">Next</span>
          <ArrowRightIcon className="h-5 w-5 mr-2" />
        </button>
      </div>
      <div className="flex space-x-4">
        <Worker workerUrl={`node_modules/pdfjs-dist/build/pdf.worker.min.js`}>
          <div className="w-1/2 h-screen border">
            <div className="flex items-center justify-center h-12">
              <p className="text-center">Old (Mailed)</p>
            </div>
            <Viewer
              fileUrl={currentComparison.old}
              plugins={[defaultLayout1, highlightPluginLeft]}
              onDocumentLoad={(e) => {
                const pdf = e.doc;
                pdf.getPage(1).then((page) => {
                  const textContent = page.getTextContent();
                  textContent.then((text) => {
                    text.items.forEach((item) => {
                      const textSpan = document.createElement("span");
                      textSpan.innerText = item.str;
                      textSpan.classList.add("hoverable-word");
                      textSpan.onmouseenter = () =>
                        handleMouseOverWord(item.str);
                      textSpan.onmouseleave = handleMouseOutWord;
                      console.log(textSpan);
                      // Append to text layer (adjust as necessary to find correct text layer node)
                      document
                        .querySelector(".rpv-core__text-layer")
                        ?.appendChild(textSpan);
                    });
                  });
                });
              }}
            />
          </div>
          <div className="w-1/2 h-screen border">
            <div className="flex items-center justify-center h-12">
              <p className="text-center">New (Proposed)</p>
            </div>
            <Viewer
              fileUrl={currentComparison.new}
              plugins={[defaultLayout2, highlightPluginRight]}
            />
          </div>
        </Worker>
      </div>
    </div>
  );
}

export default ComparisonViewer;
