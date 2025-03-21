import CaseJudgements from "../models/dataset_models/caseJugdements.models.js";
import CommonLaws from "../models/dataset_models/commonLaws.models.js";
import FirIpcLaws from "../models/dataset_models/firIPC.models.js";
import IndianConstitution from "../models/dataset_models/indianConstitution.models.js";
import QuesAndAns from "../models/dataset_models/quesAndAns.models.js";
import WorkerLaws from "../models/dataset_models/workerLaws.models.js";

// Function to search and rank results based on keyword matches
const searchInAllDatasets = async (keywords) => {
  try {
    const searchConditions = keywords.map((keyword) => ({
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { content: { $regex: keyword, $options: "i" } },
      ],
    }));

    // Fetch results from all datasets in parallel
    const datasets = await Promise.all([
      // CaseJudgements.find({ $or: searchConditions }),
      CommonLaws.find({ $or: searchConditions }),
      // FirIpcLaws.find({ $or: searchConditions }),
      // IndianConstitution.find({ $or: searchConditions }),
      // QuesAndAns.find({ $or: searchConditions }),
      // WorkerLaws.find({ $or: searchConditions }),
    ]);

    // Flatten all results into a single array
    let allResults = datasets.flat();

    // Rank results by counting keyword matches
    const scoredResults = allResults
      .map((item) => {
        const titleMatches = keywords.filter((kw) =>
          item.title?.toLowerCase().includes(kw.toLowerCase())
        ).length;

        const contentMatches = keywords.filter((kw) =>
          item.content?.toLowerCase().includes(kw.toLowerCase())
        ).length;

        const totalMatches = titleMatches + contentMatches;
        return { ...item.toObject(), score: totalMatches };
      })
      .filter((item) => item.score > 0) // Remove results with zero matches
      .sort((a, b) => b.score - a.score) // Sort by highest keyword match
      .slice(0, 10); // Limit to top 10 results

    return scoredResults;

  

  } catch (error) {
    console.error("Error searching datasets:", error);
    throw new Error("Error searching datasets");
  }
};

// In the backend search controller
const search = async (req, res) => {
  const { keywords } = req.query;

  if (!keywords) {
    return res.status(400).json({ message: "Keywords are required" });
  }

  try {
    const parsedKeywords = JSON.parse(keywords);
    const results = await searchInAllDatasets(parsedKeywords);


    // If description is available, map it to content
    const formattedResults = results.map((item) => ({
      ...item,
      content: item.description, // Make sure content is available for summarization
    }));

    res.json(formattedResults); // Send the formatted results to frontend


  } catch (error) {
    console.error("Error during search:", error);
    res.status(500).json({ message: "Error during search" });
  }
};

export { search };