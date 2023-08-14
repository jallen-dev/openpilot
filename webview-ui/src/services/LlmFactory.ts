import {
  GOOGLE_MODELS,
  GoogleModel,
  Model,
  OPENAI_MODELS,
  OpenaiModel
} from "../../../src/shared/Model"
import { GoogleService } from "./GoogleService"
import { OpenaiService } from "./OpenaiService"
import { OpenpilotService } from "./OpenpilotService"

export function llmFactory(model: Model) {
  if (isOpenaiModel(model)) {
    return new OpenaiService(model)
  }
  if (isGoogleModel(model)) {
    return new GoogleService(model)
  }
  return new OpenpilotService()
}

function isGoogleModel(model: Model): model is GoogleModel {
  return GOOGLE_MODELS.includes(model as GoogleModel)
}

function isOpenaiModel(model: Model): model is OpenaiModel {
  return OPENAI_MODELS.includes(model as OpenaiModel)
}
