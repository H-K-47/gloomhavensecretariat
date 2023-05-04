import { Component, Input } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';

@Component({
  selector: 'ghs-monster-image',
  templateUrl: './image.html',
  styleUrls: ['./image.scss']
})
export class MonsterImageComponent {

  @Input() monster!: Monster;
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;

  async toggleFigure() {
    if (gameManager.game.state == GameState.next) {
      await gameManager.stateManager.before(this.monster.active ? "unsetActive" : "setActive", "data.monster." + this.monster.name);
      gameManager.roundManager.toggleFigure(this.monster);
      await gameManager.stateManager.after();
    }
  }

}