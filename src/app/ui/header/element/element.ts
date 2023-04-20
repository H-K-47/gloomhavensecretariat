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
    const elementState = gameManager.nextElementState(this.element, double);
    gameManager.stateManager.before("updateElement", "game.element." + this.element.type, "game.element.state." + elementState);
    this.element.state = elementState;
    gameManager.stateManager.after();
  }

}