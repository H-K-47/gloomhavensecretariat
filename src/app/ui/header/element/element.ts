import { Component, Input, ViewEncapsulation } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { ElementModel, ElementState } from "src/app/game/model/data/Element";
import { GameState } from "src/app/game/model/Game";

@Component({
  selector: 'ghs-element',
  templateUrl: './element.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./element.scss']
})
export class ElementComponent {

  @Input() element!: ElementModel;
  gameManager: GameManager = gameManager;
  GameState = GameState;
  ElementState = ElementState;

  toggleElement(double: boolean = false): void {
    const elementState = this.nextElementState(this.element, double);
    gameManager.stateManager.before("updateElement", "game.element." + this.element.type, "game.element.state." + elementState);
    this.element.state = elementState;
    gameManager.stateManager.after();
  }

  nextElementState(element: ElementModel, double: boolean = false): ElementState {
    if (gameManager.game.state == GameState.draw) {
      if (element.state == ElementState.new) {
        if (!double) {
          return ElementState.strong;
        }
      }
      if (element.state == ElementState.new || element.state == ElementState.strong) {
        if (!double) {
          return ElementState.waning;
        }
      } else if (element.state == ElementState.waning) {
        return ElementState.inert;
      } else {
        if (double) {
          return ElementState.waning;
        } else {
          return ElementState.new;
        }
      }
    } else {
      if (element.state == ElementState.new) {
        if (!double) {
          return ElementState.strong;
        }
      } if (element.state == ElementState.strong) {
        if (double) {
          return ElementState.waning;
        }
      } else if (element.state == ElementState.waning) {
        if (double) {
          return ElementState.new;
        }
      } else {
        if (double) {
          return ElementState.waning;
        } else {
          return ElementState.new;
        }
      }
    }

    return ElementState.inert;
  }

}